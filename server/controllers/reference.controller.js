async function list(req, res, next) {
    try {
        res.json({
            farms: [
                {
                    id: "FARM-001",
                    name: "Green Valley Farm"
                }
            ],

            cropTypes: [
                {
                    id: "tomato",
                    name: "Tomato"
                },
                {
                    id: "maize",
                    name: "Maize"
                }
            ],

            varieties: {
                tomato: [
                    "Roma Tomato",
                    "Cherry Tomato"
                ],

                maize: [
                    "DK8031",
                    "H6213"
                ]
            },

            pests: [
                "Whitefly",
                "Thrips",
                "Aphids"
            ],

            diseases: [
                "Blight",
                "Powdery Mildew"
            ]
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    list
};