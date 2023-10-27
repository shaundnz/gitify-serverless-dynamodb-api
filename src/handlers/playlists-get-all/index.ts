import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    body: JSON.stringify({
      message: "Successful playlist-get-all lambda invocation",
    }),
    statusCode: 201,
  };
};
