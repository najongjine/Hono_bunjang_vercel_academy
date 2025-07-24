import { sql } from "../../db.js";

export const get_product_list = async (
  search_keyword: string,
  page_no = 1,
  item_limit = 50
) => {
  let data: any;
  let whereClause = sql``;
  try {
    const keyword = `%${search_keyword}%`;
    whereClause = sql`AND (p.title ILIKE ${keyword} OR p.content ILIKE ${keyword})`;
    data = await sql`
SELECT
p.idp
,p.title
,p.content
,p.price
,p.category_idp
,p.created_dt
,p.updated_dt
,MAX(c.category_name) as category_name
,COALESCE(
  json_agg(
    json_build_object(
      'img_idp', pi.idp,
      'img_url', pi.img_url,
      'product_idp', pi.product_idp,
      'created_dt', pi.created_dt
    )
  ) FILTER (WHERE pi.idp IS NOT NULL),
  '[]'
) AS imgs

FROM t_product AS p
LEFT JOIN t_product_img pi ON p.idp = pi.product_idp
LEFT JOIN t_category as c ON c.idp=p.category_idp
WHERE 1=1
${whereClause}
GROUP BY p.idp
ORDER BY p.created_dt DESC
OFFSET (${page_no} - 1) * ${item_limit}
LIMIT ${item_limit}
    `;
  } catch (error) {
    console.error(`!!! get_product_list. `, error?.message ?? "");
    data = undefined;
  }
  return data;
};
