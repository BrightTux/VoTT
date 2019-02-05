import React from "react";
import { IAppError, ErrorCode, AppError } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import Alert from "../alert/alert";
import { instanceOf } from "prop-types";

/**
 * Component properties for ErrorHandler component
 */
export interface IErrorHandlerProps extends React.Props<ErrorHandler> {
    error: IAppError;
    onError: (error: IAppError) => void;
    onClearError: () => void;
}

/**
 * Component for catching and handling global application errors
 */
export class ErrorHandler extends React.Component<IErrorHandlerProps> {
    constructor(props, context) {
        super(props, context);

        this.onWindowError = this.onWindowError.bind(this);
        this.onUnhandedRejection = this.onUnhandedRejection.bind(this);
    }

    public componentDidMount() {
        window.addEventListener("error", this.onWindowError, true);
        window.addEventListener("unhandledrejection", this.onUnhandedRejection, true);
    }

    public componentWillMount() {
        window.removeEventListener("error", this.onWindowError);
        window.removeEventListener("unhandledrejection", this.onUnhandedRejection);
    }

    public render() {
        const showError = !!this.props.error;
        let localizedError: IAppError = null;
        if (showError) {
            localizedError = this.getLocalizedError(this.props.error);
        }

        if (!showError) {
            return null;
        }

        return (
            <Alert title={localizedError ? localizedError.title : ""}
                message={localizedError ? localizedError.message : ""}
                closeButtonColor="secondary"
                show={showError}
                onClose={this.props.onClearError} />
        );
    }

    /**
     * Unhandled errors that bubbled up to top of stack
     * @param evt Error Event
     */
    private onWindowError(evt: ErrorEvent) {
        this.handleError(evt.error);
        evt.preventDefault();
    }

    /**
     * Handles async / promise based errors
     * @param evt Unhandled Rejection Event
     */
    private onUnhandedRejection(evt: any) {
        this.handleError(evt.reason || evt.detail);
        evt.preventDefault();
    }

    /**
     * Handles various error format scenarios
     * @param error The error to handle
     */
    private handleError(error: string | Error | AppError) {
        let appError: IAppError = null;

        // Promise rejection with reason
        if (typeof (error) === "string") {
            // Promise rejection with string base reason
            appError = {
                errorCode: ErrorCode.Unknown,
                message: error,
            };
        } else if (error instanceof AppError) {
            // Promise rejection with AppError
            const reason = error as IAppError;
            appError = {
                errorCode: reason.errorCode,
                message: reason.message,
                title: reason.title,
            };
        } else if (error instanceof Error) {
            // Promise rejection with other error like object
            const reason = error as Error;
            appError = {
                errorCode: ErrorCode.Unknown,
                message: reason.message,
                title: reason.name,
            };
        }

        if (!appError) {
            appError = new AppError(ErrorCode.Unknown, "Unknown Error occurred");
        }

        this.props.onError(appError);
    }

    /**
     * Gets a localized version of the error
     * @param appError The error thrown by the application
     */
    private getLocalizedError(appError: IAppError): IAppError {
        const localizedError = strings.errors[appError.errorCode];
        if (!localizedError) {
            return appError;
        }

        return {
            errorCode: appError.errorCode,
            message: localizedError.message || strings.errors.unknown.message,
            title: localizedError.title || strings.errors.unknown.title,
        };
    }
}