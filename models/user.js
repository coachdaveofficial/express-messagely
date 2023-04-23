/** User class for message.ly */

const bcrypt = require("bcrypt");
const db = require("../db");
const ExpressError = require("../expressError")
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
      const results = await db.query(`
      INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING username, password, first_name, last_name, phone`, 
      [username, hashedPassword, first_name, last_name, phone])
      if (!results.rows) {
        throw new ExpressError("Username taken. Please pick another!", 400);
      }
      return results.rows[0]
   }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
      const results = await db.query(`
      SELECT username, password FROM users WHERE username = $1`, [username]);
      const user = results.rows[0];
      if (!user) {
        throw new ExpressError('Invalid username/password', 400)
      }
      return await bcrypt.compare(password, user.password)
   }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
      const results = await db.query(`
       UPDATE users SET last_login_at= current_timestamp WHERE username = $1 RETURNING username, last_login_at`, [username]
      );
      if (!results.rows) {
        throw new ExpressError(`No user with username: ${username}`, 404)
      }
      return results.rows[0];
   }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(`SELECT username, first_name, last_name, phone FROM users`);
    return results.rows;
   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    
    const results = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username = $1`, [username]);
    if (!results.rows) {
      throw new ExpressError(`No user with username: ${username}`, 404)
    }
    return results.rows[0];
    
   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
      const results = await db.query(`
      SELECT m.id, u.username AS to_username, u.first_name, u.last_name, u.phone,
      m.body, m.sent_at, m.read_at
      FROM messages AS m
      JOIN users AS u ON m.to_username = u.username
      WHERE m.from_username = $1
      ORDER BY m.sent_at DESC`, [username])
      if (!results.rows) {
        throw new ExpressError(`No user with username: ${username}`, 404)
      }

      return results.rows.map(row => {
        return {
          id: row.id,
          to_user: {
            username: row.to_username,
            first_name: row.first_name,
            last_name: row.last_name,
            phone: row.phone
          },
          body: row.body,
          sent_at: row.sent_at,
          read_at: row.read_at
        };
      });
   }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
      const results = await db.query(`
      SELECT m.id, u.username AS from_username, u.first_name, u.last_name, u.phone,
      m.body, m.sent_at, m.read_at
      FROM messages AS m
      JOIN users AS u ON m.from_username = u.username
      WHERE m.to_username = $1
      ORDER BY m.sent_at DESC`, [username]);
      if (!results.rows) {
        throw new ExpressError(`No user with username: ${username}`, 404)
      }

      return results.rows.map(row => {
        return {
          id: row.id,
          from_user: {
            username: row.from_username,
            first_name: row.first_name,
            last_name: row.last_name,
            phone: row.phone
          },
          body: row.body,
          sent_at: row.sent_at,
          read_at: row.read_at
        };
      });
   }

}


module.exports = User;