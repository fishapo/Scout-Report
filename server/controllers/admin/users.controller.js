"use strict";

const { query } = require("../../db");
const { ROLES } = require("../../workflow");

const MANAGED_ROLES = new Set([
  ROLES.SCOUT,
  ROLES.INTER_FARM_SUPERVISOR,
  ROLES.HEAD_OF_DEPARTMENT,
  ROLES.ADMIN,
]);

async function listUsers(_req, res, next) {
  try {
    const result = await query(`SELECT id, name, email, role, is_active, created_at, updated_at FROM users ORDER BY name, email`);
    res.json({ success: true, users: result.rows });
  } catch (error) { next(error); }
}

async function updateRole(req, res, next) {
  try {
    const role = String(req.body?.role || "").trim();
    if (!MANAGED_ROLES.has(role)) {
      return res.status(400).json({ success: false, error: "Invalid application role" });
    }
    if (req.params.id === req.user.id && role !== ROLES.ADMIN) {
      return res.status(400).json({ success: false, error: "Administrators cannot remove their own administrator role" });
    }
    const result = await query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role, is_active, created_at, updated_at`,
      [role, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, user: result.rows[0] });
  } catch (error) { next(error); }
}



async function createUser(req, res, next) {
  try {
    const auth = require("../../auth");
    const input = req.body || {};
    const email = String(input.email || "").trim().toLowerCase();
    const name = String(input.name || "").trim();
    const role = String(input.role || "scout").trim();
    if (!email || !name || !input.password) return res.status(400).json({ success:false, error:"Name, email, password and role are required" });
    if (!MANAGED_ROLES.has(role)) return res.status(400).json({ success:false, error:"Invalid application role" });
    const passwordHash = await auth.hashPassword(input.password);
    const id = require("crypto").randomUUID();
    const result = await query(`INSERT INTO users (id,email,name,password_hash,role,is_active,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,true,NOW(),NOW()) RETURNING id,name,email,role,is_active,created_at,updated_at`, [id,email,name,passwordHash,role]);
    res.status(201).json({success:true,user:result.rows[0]});
  } catch (error) {
    if (error?.code === "23505") return res.status(409).json({success:false,error:"Email already exists"});
    next(error);
  }
}

async function setPassword(req, res, next) {
  try {
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
    }
    const target = await query(`SELECT id, email, name, role, is_active FROM users WHERE id=$1`, [req.params.id]);
    if (!target.rowCount) return res.status(404).json({ success: false, error: "User not found" });

    const auth = require("../../auth");
    const passwordHash = await auth.hashPassword(password);
    const result = await query(
      `UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2 RETURNING id, name, email, role, is_active, created_at, updated_at`,
      [passwordHash, req.params.id]
    );

    // Revoke existing sessions so the new password is the only active credential.
    await query(`UPDATE user_sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL`, [req.params.id]);
    res.json({ success: true, user: result.rows[0] });
  } catch (error) { next(error); }
}

async function deleteUser(req, res, next) {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({success:false,error:"Administrators cannot delete their own account"});
    const target = await query(`SELECT id,role FROM users WHERE id=$1`, [req.params.id]);
    if (!target.rowCount) return res.status(404).json({success:false,error:"User not found"});
    if (target.rows[0].role === "admin") {
      const admins = await query(`SELECT COUNT(*)::int AS count FROM users WHERE role='admin' AND is_active=true`);
      if (Number(admins.rows[0].count) <= 1) return res.status(400).json({success:false,error:"The last active administrator cannot be deleted"});
    }
    await query(`DELETE FROM users WHERE id=$1`, [req.params.id]);
    res.status(204).end();
  } catch (error) { next(error); }
}

module.exports = { listUsers, updateRole, createUser, setPassword, deleteUser };
