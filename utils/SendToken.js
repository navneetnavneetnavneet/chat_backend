module.exports.sendToken = (statusCode, res, user) => {
  const token = user.generateToken();

  const options = {
    expire: new Date(
      Date.now() + 24 * 60 * 60 * 1000 + process.env.COOKIE_EXPIRE
    ),
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    _id: user._id,
    token,
  });
};
