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
  clientConfigURL: "https://ulqgs43gc2.execute-api.us-east-1.amazonaws.com/dev/config/28bf5cd7-3f38-4e8f-b952-a90e06bd88cc",
  userID: "us-east-1:34ee9094-c95a-4f8f-b2c2-551ef33bd49f", // TODO pull from DB config
  cloudfrontURL: "https://d1ljva6zkf6zjh.cloudfront.net",
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
  // TODO change to prod endpoint with prod client ID:
  clientConfigURL: "https://ulqgs43gc2.execute-api.us-east-1.amazonaws.com/dev/config/28bf5cd7-3f38-4e8f-b952-a90e06bd88cc",
  userID: "us-east-1:e51b2b71-8b21-46c0-a302-6f3b84783041", // TODO change to Shana's user ID and pull from DB config
  cloudfrontURL: "https://d1esxin5o90ebg.cloudfront.net",
};

// Default to dev if not set
const config = process.env.REACT_APP_STAGE === 'prod'
  ? prod
  : dev;

export default {
  // Add common config values here
  ...config
};
