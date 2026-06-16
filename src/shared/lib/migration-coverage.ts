export type MigrationCoverageSummary = {
  filesystemMigrationNames: string[];
  appliedMigrationNames: string[];
  missingMigrationNames: string[];
  extraAppliedMigrationNames: string[];
  fullyApplied: boolean;
};

export function summarizeMigrationCoverage(input: {
  filesystemMigrationNames: string[];
  appliedMigrationNames: string[];
}): MigrationCoverageSummary {
  const filesystemMigrationNames = [...input.filesystemMigrationNames].sort();
  const appliedMigrationNames = [...input.appliedMigrationNames].sort();
  const appliedSet = new Set(appliedMigrationNames);
  const filesystemSet = new Set(filesystemMigrationNames);

  const missingMigrationNames = filesystemMigrationNames.filter(
    (migrationName) => !appliedSet.has(migrationName),
  );
  const extraAppliedMigrationNames = appliedMigrationNames.filter(
    (migrationName) => !filesystemSet.has(migrationName),
  );

  return {
    filesystemMigrationNames,
    appliedMigrationNames,
    missingMigrationNames,
    extraAppliedMigrationNames,
    fullyApplied: missingMigrationNames.length === 0,
  };
}
