const Imagekit = require("imagekit");

module.exports.initImagekit = () => {
  const imagekit = new Imagekit({
    publicKey: process.env.PUBLIC_KEY_IMAGEKIT,
    privateKey: process.env.PRIVATE_KEY_IMAGEKIT,
    urlEndpoint: process.env.URL_END_POINT_IMAGEKIT,
  });

  return imagekit;
};
