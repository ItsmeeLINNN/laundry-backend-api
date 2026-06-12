const fs = require('fs');
const path = require('path');
const db = require('./config/db');

const sqlPath = path.join(__dirname, 'nailong_laundry.sql');

function splitSql(sql) {
    return sql
        .split(/;\s*(?:\r?\n|$)/)
        .map((statement) => statement.trim())
        .filter(Boolean);
}

async function queryPromise(sql) {
    return new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(result);
        });
    });
}

async function jalankanMigrasi() {
    console.log('Memulai setup database Spincycle...');

    try {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        const statements = splitSql(sql);

        for (const statement of statements) {
            await queryPromise(statement);
        }

        console.log('Setup database selesai.');
        process.exit(0);
    } catch (error) {
        console.error('Setup database gagal:', error);
        process.exit(1);
    }
}

jalankanMigrasi();
