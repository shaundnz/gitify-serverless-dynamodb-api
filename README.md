<div align="center">

<a href="https://gitify.shaundnz.com">
    <img src="static/favicon.svg" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Gitify</h3>

  <p align="center">
    A version control system for Spotify playlists, to track how they change over time.
    <br />
    <a href="https://gitify.shaundnz.com"><strong>View Demo</strong></a>
    <br />
    <br />
    <a href="https://github.com/shaundnz/gitify-client">Client Repository</a>
    ·
    <a href="https://github.com/shaundnz/gitify-serverless-dynamodb-api">API Repository</a>
  </p>
</div>

## About the Project

Gitify is a version control system for Spotify playlists. A cron job takes a snapshot of tracked playlists every 24 hours, and stores this information in a DynamoDB table, then triggers a build to generate a new static site with the latest playlist information.

This project is hosted on AWS. The front end is a static site hosted on S3 and served through CloudFront. The back end is a serverless REST API built with Lambdas and API Gateway. Both repositories have CI/CD pipelines that deploy automatically on any push to the main branch.

<table>
  <tr>
    <td>Home Page</td>
     <td>Playlist Page</td>
  </tr>
  <tr>
    <td><img alt="Home Page" src="https://i.imgur.com/yal1V6n.png"></td>
    <td><img alt="Playlist Page" src="https://i.imgur.com/4uBbMre.png"></td>
  </tr>
 </table>

### Built With

- [![Svelte][Svelte.dev]][Svelte-url]
- [![Lambda][Lambda]][Lambda-url]
- [![Aws][Aws]][Aws-url]
- [![GitHubActions][Github-actions]][Github-actions-url]
- [![Spotify][Spotify]][Spotify-url]

## Architecture

![AWS Architecture diagram for gitify](https://i.imgur.com/SRumGUl.png)

This application was a great use case for serverless functions and static site generation, as the database is only updated with new information once a day.

The Lambdas are connected to REST API endpoints through API Gateway. They are only invoked once a day by the cron job to update the playlists with new snapshots, and then get the latest playlist information to generate the static build files. The Spotify API is used to generate the snapshots.

Static site generation was also ideal as content served to the client only needs to be changed once a day. All API requests are made at build time, and these responses are baked into the generated build files. This removes the issue of Lambda cold starts as the API response information is part of the static build and is served directly from S3, additionally, these files can be cached by CloudFront, ensuring very fast load times.

## Additional Notes

### Motivations

I wanted to build something with serverless functions, and the Spotify version control project was an idea that I had wanted to create for some time since the use case for serverless functions fit really well here. I had previously only built REST APIs with the traditional server architecture and felt it was important to know how serverless REST APIs work so I could understand the differences between them and learn the strengths and weaknesses of each approach.

Learning Lambdas has been on my radar for some time, and this project was a great way to get hands-on experience with them. Beyond REST APIs, I feel there are so many uses for serverless functions, and this application was just a starting point. They provide a whole new approach to solving problems, and I can use the experience I gained here to better evaluate if other use cases will benefit from a serverless approach in the future.

The project itself is something I find personally very useful and was a lot of fun to make. I often don't keep track of songs I listen to on Spotify, and there have been times when I have lost a song I was trying to find since the playlist was updated, so hopefully, that won't happen again!

### Contact Me

[Personal Website](https://shaundnz.com/)

[LinkedIn](https://www.linkedin.com/feed/)

[Svelte.dev]: https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00
[Svelte-url]: https://svelte.dev/
[Lambda]: https://img.shields.io/badge/AWS%20Lambda-%23FF9900.svg?style=for-the-badge&logo=awslambda&logoColor=white
[Lambda-url]: https://aws.amazon.com/lambda/
[Aws]: https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white
[Aws-url]: https://aws.amazon.com
[Github-actions]: https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white
[Github-actions-url]: https://github.com/features/actions
[Spotify]: https://img.shields.io/badge/Spotify%20API-1ED760?style=for-the-badge&logo=spotify&logoColor=white
[Spotify-url]: https://developer.spotify.com/documentation/web-api
