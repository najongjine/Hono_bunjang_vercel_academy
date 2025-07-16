import { sql } from "../../db.js";

export interface UserRole {
  role_idp: string;
  user_idp: string;
  irole: string;
  created_dt: string; // 또는 Date 타입을 원하면 Date
}

export interface UserData {
  idp: string;
  uid: string;
  email: string;
  displayname: string;
  photourl: string;
  providerid: string;
  created_dt: string;
  updated_dt: string;
  roles: UserRole[]; // JSON 배열 형태로 들어옴
}
export const get_userdata_by_uid = async (uid: string) => {
  let userData: any;
  const userRows = await sql`
SELECT 
    u.idp,
    u.uid,
    u.email,
    u.displayname,
    u.photourl,
    u.providerid,
    u.created_dt,
    u.updated_dt,
    COALESCE(
      json_agg(
        json_build_object(
          'role_idp', r.idp,
          'user_idp', r.user_idp,
          'irole', r.irole,
          'created_dt', r.created_dt
        )
      ) FILTER (WHERE r.idp IS NOT NULL),
      '[]'
    ) AS roles
  FROM t_user AS u
  LEFT JOIN t_user_role r ON u.idp = r.user_idp
  WHERE uid = ${uid}
  GROUP BY u.idp
  LIMIT 1
    `;
  try {
    userData = userRows[0];
  } catch (error) {
    userData = undefined;
  }
  return userData as UserData;
};
