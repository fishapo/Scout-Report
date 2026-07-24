const { query } = require("../server/db");

(async () => {
    try {
        const result = await query(`
            SELECT
                column_name,
                data_type
            FROM information_schema.columns
            WHERE table_name = 'scout_reports'
            ORDER BY ordinal_position;
        `);

        console.table(result.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
})();