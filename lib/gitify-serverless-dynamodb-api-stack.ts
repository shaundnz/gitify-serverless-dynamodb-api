import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

const envVariables = {
  DYNAMO_ENDPOINT: "newendpoint.com",
  DYNAMO_TABLE_NAME: process.env.DYNAMO_TABLE_NAME || "",
  SPOTIFY_CLIENT_ID: "",
  SPOTIFY_CLIENT_SECRET: "",
};

export class GitifyServerlessDynamodbApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const playlistsGetAllHandler = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "playlists-get-all",
      {
        timeout: cdk.Duration.seconds(5),
        memorySize: 1024,
        entry: "src/handlers/playlists-get-all/index.ts",
        environment: envVariables,
      }
    );

    const playlistGetSingleHandler = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "playlists-get-single",
      {
        timeout: cdk.Duration.seconds(5),
        memorySize: 1024,
        entry: "src/handlers/playlists-get-single/index.ts",
        environment: envVariables,
      }
    );

    const playlistUpdateAllHandler = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "playlists-update-all",
      {
        timeout: cdk.Duration.seconds(120),
        memorySize: 1024,
        entry: "src/handlers/playlists-update-all/index.ts",
        environment: envVariables,
      }
    );

    const api = new cdk.aws_apigateway.RestApi(this, "api", {
      defaultCorsPreflightOptions: {
        allowOrigins: ["http://127.0.0.1:5173"],
      },
    });
    const playlists = api.root.addResource("playlists");
    playlists.addMethod(
      "GET",
      new cdk.aws_apigateway.LambdaIntegration(playlistsGetAllHandler)
    );

    playlists.addMethod(
      "POST",
      new cdk.aws_apigateway.LambdaIntegration(playlistUpdateAllHandler)
    );

    const playlist = playlists.addResource("{id}");
    playlist.addMethod(
      "GET",
      new cdk.aws_apigateway.LambdaIntegration(playlistGetSingleHandler)
    );
  }
}
