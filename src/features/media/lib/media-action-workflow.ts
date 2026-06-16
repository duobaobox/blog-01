export type MediaWorkflow = {
  adminPaths: string[];
};

function buildMediaWorkflow(paths: string[]): MediaWorkflow {
  return {
    adminPaths: [...new Set(paths)],
  };
}

export function buildUploadMediaWorkflow() {
  return buildMediaWorkflow(["/admin/media"]);
}

export function buildDeleteMediaWorkflow() {
  return buildMediaWorkflow(["/admin/media"]);
}

export function buildUpdateMediaAltWorkflow() {
  return buildMediaWorkflow(["/admin/media"]);
}

export function buildReplaceMediaWorkflow() {
  return buildMediaWorkflow(["/admin/media", "/admin/posts"]);
}
