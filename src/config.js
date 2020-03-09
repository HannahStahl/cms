const dev = {
  s3: {
    REGION: "us-east-1",
    BUCKET: "items-api-dev-attachmentsbucket-gvt58wvroe9m"
  },
  apiGateway: {
    REGION: "us-east-1",
    URL: "https://z24pdah0n6.execute-api.us-east-1.amazonaws.com/dev"
  },
  cognito: {
    REGION: "us-east-1",
    USER_POOL_ID: "us-east-1_PaM6EER5u",
    APP_CLIENT_ID: "3u5k9uci7j6logakre4o1ha6ho",
    IDENTITY_POOL_ID: "us-east-1:ea5b595a-b529-4f0e-8565-238ddf43a0e3"
  },
  cloudfrontURL: "https://d1c360lneb6ftg.cloudfront.net", // TODO pull from DB config
};

const prod = {
  s3: {
    REGION: "us-east-1",
    BUCKET: "items-api-prod-attachmentsbucket-1vrdtx8hih67"
  },
  apiGateway: {
    REGION: "us-east-1",
    URL: "https://wcyjuqg2li.execute-api.us-east-1.amazonaws.com/prod"
  },
  cognito: {
    REGION: "us-east-1",
    USER_POOL_ID: "us-east-1_SD8hiZ8I8",
    APP_CLIENT_ID: "7i6bi5n6i7l36vopjn1ioj8576",
    IDENTITY_POOL_ID: "us-east-1:0076c7d8-65d8-4f2f-b4e8-476048d8b7de"
  },
  cloudfrontURL: "https://d3v8t7grqk8z3g.cloudfront.net", // TODO change to Shana's user ID Cloudfront & pull from DB config
};

// Default to dev if not set
const config = process.env.REACT_APP_STAGE === 'prod'
  ? prod
  : dev;

export default {
  // Add common config values here
  ...config
};
