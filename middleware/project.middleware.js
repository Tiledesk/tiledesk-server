module.exports = async function projectMiddleware(req, res, next) {
    try {
        const { projectId } = req.params;

        const project = await findProject(projectId);
        if (!project) return res.status(404).send("Project not found");

        const projectUser = await findProjectUser(req.user.id, projectId);

        if (!projectUser) {
            return res.status(403).send("User not in project");
        }

        req.project = project;
        req.projectUser = projectUser;

        next();
    } catch (err) {
        res.status(500).send("Error loading project");
    }
};

// mock
async function findProject(id) {
    return { id };
}

async function findProjectUser(userId, projectId) {
    return {
        userId,
        projectId,
        role: "agent",
        roleType: 1,
        permissions: ["chat.send"] // custom override
    };
}