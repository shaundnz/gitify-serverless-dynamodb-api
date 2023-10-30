import { APIGatewayProxyEvent } from "aws-lambda";

export const authorizeIncomingRequest = (
  request: APIGatewayProxyEvent
): boolean => {
  const headerName = "X-API-Key";
  const headers = Object.keys(request.headers);
  const apiHeader = headers.find((key) => {
    return key.toLocaleLowerCase() === headerName.toLocaleLowerCase();
  });

  if (!apiHeader) return false;

  return request.headers[apiHeader] === process.env.SECRET_API_KEY;
};
