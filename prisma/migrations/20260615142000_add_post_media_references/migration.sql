-- CreateTable
CREATE TABLE "postMediaReference" (
    "postId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "usage" TEXT NOT NULL,

    CONSTRAINT "postMediaReference_pkey" PRIMARY KEY ("postId","mediaId","usage")
);

-- CreateIndex
CREATE INDEX "postMediaReference_postId_idx" ON "postMediaReference"("postId");

-- CreateIndex
CREATE INDEX "postMediaReference_mediaId_usage_idx" ON "postMediaReference"("mediaId", "usage");

-- AddForeignKey
ALTER TABLE "postMediaReference" ADD CONSTRAINT "postMediaReference_postId_fkey" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postMediaReference" ADD CONSTRAINT "postMediaReference_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
