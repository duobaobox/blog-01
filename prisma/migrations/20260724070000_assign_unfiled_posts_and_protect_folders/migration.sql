-- 将历史未归属笔记统一放入“收件箱”，并阻止删除仍包含笔记的文件夹。
DO $$
DECLARE
  inbox_id TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM "post" WHERE "folderId" IS NULL) THEN
    SELECT "id" INTO inbox_id
    FROM "folder"
    WHERE "slug" = 'inbox'
    LIMIT 1;

    IF inbox_id IS NULL THEN
      inbox_id := gen_random_uuid()::text;

      INSERT INTO "folder" (
        "id",
        "name",
        "slug",
        "description",
        "sortOrder",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        inbox_id,
        '收件箱',
        'inbox',
        '由系统接收历史未归属笔记',
        -1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      );
    END IF;

    UPDATE "post"
    SET "folderId" = inbox_id
    WHERE "folderId" IS NULL;
  END IF;
END $$;

ALTER TABLE "post"
  DROP CONSTRAINT IF EXISTS "post_folderId_fkey";

ALTER TABLE "post"
  ADD CONSTRAINT "post_folderId_fkey"
  FOREIGN KEY ("folderId")
  REFERENCES "folder"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
