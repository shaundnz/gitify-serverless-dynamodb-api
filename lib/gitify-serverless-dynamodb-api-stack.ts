import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

const envVariables = {
  DYNAMO_ENDPOINT: process.env.DYNAMO_ENDPOINT || "",
  DYNAMO_TABLE_NAME: process.env.DYNAMO_TABLE_NAME || "",
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || "",
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || "",
  SECRET_API_KEY: process.env.SECRET_API_KEY || "",
};

export class GitifyServerlessDynamodbApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // Lambda Definitions
    const playlistsGetAllHandler = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "playlists-get-all",
      {
        timeout: cdk.Duration.seconds(30),
        memorySize: 1024,
        entry: "src/handlers/playlists-get-all/index.ts",
        environment: envVariables,
      }
    );

    const playlistGetSingleHandler = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "playlists-get-single",
      {
        timeout: cdk.Duration.seconds(30),
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

    const playlistUpdateAllDummyHandler =
      new cdk.aws_lambda_nodejs.NodejsFunction(
        this,
        "playlists-update-all-dummy",
        {
          timeout: cdk.Duration.seconds(120),
          memorySize: 1024,
          entry: "src/handlers/playlists-update-all-dummy/index.ts",
          environment: envVariables,
        }
      );

    const playlistTriggerUpdateAllJobHandler =
      new cdk.aws_lambda_nodejs.NodejsFunction(
        this,
        "playlists-trigger-update-all-job",
        {
          timeout: cdk.Duration.seconds(15),
          memorySize: 1024,
          entry: "src/handlers/playlists-trigger-update-all-job/index.ts",
          environment: envVariables,
        }
      );

    const updatePlaylistsJobStatusHandler =
      new cdk.aws_lambda_nodejs.NodejsFunction(
        this,
        "playlists-get-update-status",
        {
          timeout: cdk.Duration.seconds(15),
          memorySize: 1024,
          entry: "src/handlers/playlists-get-update-status/index.ts",
          environment: envVariables,
        }
      );

    // Step Function Definitions
    const stateMachine = new cdk.aws_stepfunctions.StateMachine(
      this,
      "UpdatePlaylistsStateMachine",
      {
        definition: new cdk.aws_stepfunctions_tasks.LambdaInvoke(
          this,
          "UpdateAllPlaylistsTask",
          {
            lambdaFunction: playlistUpdateAllDummyHandler,
          }
        ).next(new cdk.aws_stepfunctions.Succeed(this, "UpdatedPlaylists")),
      }
    );

    // API Gateway Definitions
    const api = new cdk.aws_apigateway.RestApi(this, "api", {
      defaultCorsPreflightOptions: {
        allowOrigins: ["http://127.0.0.1:5173", "http://localhost:5173"],
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

    const jobStatus = api.root.addResource("jobstatus").addResource("{id}");

    jobStatus.addMethod(
      "GET",
      new cdk.aws_apigateway.LambdaIntegration(updatePlaylistsJobStatusHandler)
    );
  }
}
