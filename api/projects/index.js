const { projects } = require('../seed-data');

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(projects);
};
