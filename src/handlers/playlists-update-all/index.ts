import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    body: JSON.stringify({
      message: "Successful playlist-update-all lambda invocation",
    }),
    statusCode: 200,
  };
};
