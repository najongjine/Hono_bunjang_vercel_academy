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
      u.idp
      ,u.uid
      ,email
      ,displayname
      ,photourl
      ,providerid
      ,created_dt
      ,updated_dt
      ,COALESCE(
        json_agg(
         r.idp as role_idp
         ,r.user_idp
         ,r.irole
         ,r.created_dt
        ) FILTER (WHERE r.uid IS NOT NULL), '[]'
      ) AS roles
      FROM t_user as u
      LEFT JOIN t_user_role r ON u.idp = r.idp
      WHERE uid = ${uid}
      LIMIT 1
    `;
  try {
    userData = userRows[0];
  } catch (error) {
    userData = undefined;
  }
  return userData as UserData;
};
