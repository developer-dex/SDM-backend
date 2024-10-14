export class ResponseService {
    responseWithData(
        responseStatus: boolean,
        responseCode: number,
        responseMessage: string,
        responseData: any
    ) {
        return {
            responseStatus: responseStatus,
            responseCode: responseCode,
            responseMessage: responseMessage,
            responseData: responseData,
        };
    }
    responseWithoutData(
        responseStatus: boolean,
        responseCode: number,
        responseMessage: string
    ) {
        return {
            responseStatus: responseStatus,
            responseCode: responseCode,
            responseMessage: responseMessage,
        };
    }
}
