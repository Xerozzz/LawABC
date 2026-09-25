// Express 4 only catches errors THROWN by a handler, not a rejected promise from
// an async one. A query that fails on odd input would otherwise become an
// unhandled rejection, and on Node 15+ that exits the process — taking the app
// down for every user. Forward rejections to the error handler in index.js
// instead (what the express-async-errors package does; Express 5 does it natively).
import Layer from "express/lib/router/layer.js";

Layer.prototype.handle_request = function handle(req, res, next) {
  const fn = this.handle;
  if (fn.length > 3) return next(); // not a standard request handler

  try {
    const result = fn(req, res, next);
    if (result && typeof result.catch === "function") result.catch(next);
  } catch (err) {
    next(err);
  }
};
