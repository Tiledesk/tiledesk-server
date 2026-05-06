const jwt = require("jsonwebtoken");

module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers["x-api-key"];

    if (apiKey) {
      // 👉 autenticazione server-to-server
      const projectUser = await findByApiKey(apiKey);
      if (!projectUser) return res.status(401).send("Invalid API Key");

      req.user = projectUser;
      req.authType = "apiKey";
      return next();
    }

    if (!authHeader) {
      return res.status(401).send("Missing token");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    req.authType = "jwt";

    next();
  } catch (err) {
    res.status(401).send("Unauthorized");
  }
};

// mock
async function findByApiKey(key) {
  return {
    id: "api-user",
    role: "admin",
    roleType: 1
  };
}