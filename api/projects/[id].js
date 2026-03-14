const { projects, tasks } = require('../seed-data');

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ error: 'Missing project id' });
  }
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return res.status(404).end();
  }
  const projectTasks = tasks.filter((t) => t.projectId === id);
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ...project, tasks: projectTasks });
};
