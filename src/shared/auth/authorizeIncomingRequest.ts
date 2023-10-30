import { APIGatewayProxyEvent } from "aws-lambda";

export const authorizeIncomingRequest = (
  request: APIGatewayProxyEvent
): boolean => {
  const apiKey = request.headers["X-Api-Key"];

  if (!apiKey) return false;

  return apiKey === process.env.SECRET_API_KEY;
};
