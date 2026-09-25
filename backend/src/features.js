// Feature switches, read from the environment at startup.
//
// Community is CLOSED unless COMMUNITY_ENABLED=true. Programme partners asked for
// it to stay off while testing: there are no moderators yet, and a peer chat is
// an easy place to swap (abbreviated) locations of where to buy vapes. Closed
// means the API refuses it too, not just that the tab is hidden.
export const FEATURES = {
  community: process.env.COMMUNITY_ENABLED === "true",
};

// Express middleware for routes that belong to a switchable feature.
export const requireFeature = (name) => (_req, res, next) => {
  if (FEATURES[name]) return next();
  res.status(403).json({ error: `The ${name} is closed for now.` });
};
