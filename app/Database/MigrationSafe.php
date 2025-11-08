<?php

namespace App\Database;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;

trait MigrationSafe
{
    /**
     * Execute a schema operation in a separate transaction
     */
    protected function safeTable(string $table, callable $callback): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        try {
            DB::transaction(function () use ($table, $callback) {
                Schema::table($table, $callback);
            });
        } catch (\Throwable $e) {
            // Log but don't fail - migration might be partially applied
            \Log::warning("Migration safe operation failed for table {$table}: " . $e->getMessage());
        }
    }

    /**
     * Safely drop a column if it exists
     */
    protected function safeDropColumn(string $table, $columns): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        $columnsToDrop = is_array($columns) ? $columns : [$columns];
        $existingColumns = [];

        foreach ($columnsToDrop as $column) {
            if (Schema::hasColumn($table, $column)) {
                $existingColumns[] = $column;
            }
        }

        if (empty($existingColumns)) {
            return;
        }

        try {
            DB::transaction(function () use ($table, $existingColumns) {
                Schema::table($table, function (Blueprint $table) use ($existingColumns) {
                    $table->dropColumn($existingColumns);
                });
            });
        } catch (\Throwable $e) {
            \Log::warning("Failed to drop columns from {$table}: " . $e->getMessage());
        }
    }

    /**
     * Safely add a column if it doesn't exist
     */
    protected function safeAddColumn(string $table, callable $callback): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        try {
            DB::transaction(function () use ($table, $callback) {
                Schema::table($table, function (Blueprint $table) use ($callback) {
                    $callback($table);
                });
            });
        } catch (\Throwable $e) {
            \Log::warning("Failed to add column to {$table}: " . $e->getMessage());
        }
    }

    /**
     * Safely drop a foreign key constraint
     */
    protected function safeDropForeign(string $table, $columns): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        $columnArray = is_array($columns) ? $columns : [$columns];
        
        // Check if any of the columns exist
        $hasColumns = false;
        foreach ($columnArray as $column) {
            if (Schema::hasColumn($table, $column)) {
                $hasColumns = true;
                break;
            }
        }

        if (!$hasColumns) {
            return;
        }

        // Try Laravel's method first
        try {
            DB::transaction(function () use ($table, $columnArray) {
                Schema::table($table, function (Blueprint $table) use ($columnArray) {
                    $table->dropForeign($columnArray);
                });
            });
            return;
        } catch (\Throwable $e) {
            // Fall through to raw SQL
        }

        // Try raw SQL with common constraint name patterns
        foreach ($columnArray as $column) {
            $constraintNames = [
                "{$table}_{$column}_foreign",
                "{$table}_{$column}_foreign_key",
            ];

            foreach ($constraintNames as $constraintName) {
                try {
                    DB::statement("ALTER TABLE \"{$table}\" DROP CONSTRAINT IF EXISTS \"{$constraintName}\"");
                } catch (\Throwable $e) {
                    // Continue trying other names
                }
            }

            // Also try to find the actual constraint name
            try {
                $constraints = DB::select("
                    SELECT tc.constraint_name 
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu 
                        ON tc.constraint_name = kcu.constraint_name
                        AND tc.table_schema = kcu.table_schema
                    WHERE tc.table_name = ? 
                    AND kcu.column_name = ? 
                    AND tc.constraint_type = 'FOREIGN KEY'
                ", [$table, $column]);

                foreach ($constraints as $constraint) {
                    $constraintName = $constraint->constraint_name;
                    try {
                        DB::statement("ALTER TABLE \"{$table}\" DROP CONSTRAINT IF EXISTS \"{$constraintName}\"");
                    } catch (\Throwable $e) {
                        // Continue
                    }
                }
            } catch (\Throwable $e) {
                // Ignore
            }
        }
    }

    /**
     * Safely add a foreign key constraint
     */
    protected function safeAddForeign(string $table, string $column, string $referencesTable, string $referencesColumn = 'id', string $onDelete = 'cascade'): void
    {
        if (!Schema::hasTable($table) || !Schema::hasTable($referencesTable)) {
            return;
        }

        if (!Schema::hasColumn($table, $column)) {
            return;
        }

        try {
            DB::transaction(function () use ($table, $column, $referencesTable, $referencesColumn, $onDelete) {
                Schema::table($table, function (Blueprint $table) use ($column, $referencesTable, $referencesColumn, $onDelete) {
                    $table->foreign($column)->references($referencesColumn)->on($referencesTable)->onDelete($onDelete);
                });
            });
        } catch (\Throwable $e) {
            // Constraint might already exist, ignore
        }
    }

    /**
     * Safely drop a CHECK constraint on a column
     */
    protected function safeDropCheckConstraint(string $table, string $column): void
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
            return;
        }

        try {
            $constraints = DB::select("
                SELECT tc.constraint_name 
                FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage ccu 
                    ON tc.constraint_name = ccu.constraint_name
                    AND tc.table_schema = ccu.table_schema
                WHERE tc.table_name = ? 
                AND ccu.column_name = ? 
                AND tc.constraint_type = 'CHECK'
            ", [$table, $column]);

            foreach ($constraints as $constraint) {
                $constraintName = $constraint->constraint_name;
                try {
                    DB::statement("ALTER TABLE \"{$table}\" DROP CONSTRAINT IF EXISTS \"{$constraintName}\"");
                } catch (\Throwable $e) {
                    // Continue
                }
            }

            // Also try common constraint name patterns
            $commonNames = [
                "{$table}_{$column}_check",
                "{$table}_{$column}_enum_check",
            ];

            foreach ($commonNames as $constraintName) {
                try {
                    DB::statement("ALTER TABLE \"{$table}\" DROP CONSTRAINT IF EXISTS \"{$constraintName}\"");
                } catch (\Throwable $e) {
                    // Continue
                }
            }
        } catch (\Throwable $e) {
            // Ignore
        }
    }

    /**
     * Safely add a CHECK constraint (for enum-like behavior)
     */
    protected function safeAddCheckConstraint(string $table, string $column, array $allowedValues, string $constraintName = null): void
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
            return;
        }

        // Drop existing constraints first
        $this->safeDropCheckConstraint($table, $column);

        $constraintName = $constraintName ?: "{$table}_{$column}_check";
        
        $values = array_map(function ($value) {
            return "'" . str_replace("'", "''", $value) . "'";
        }, $allowedValues);
        
        $valuesList = implode(', ', $values);

        try {
            DB::statement("ALTER TABLE \"{$table}\" ADD CONSTRAINT \"{$constraintName}\" CHECK (\"{$column}\" IN ({$valuesList}))");
        } catch (\Throwable $e) {
            // Constraint might already exist or column might not exist
        }
    }

    /**
     * Safely drop an index
     */
    protected function safeDropIndex(string $table, $columns, string $indexName = null): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        try {
            DB::transaction(function () use ($table, $columns, $indexName) {
                Schema::table($table, function (Blueprint $table) use ($columns, $indexName) {
                    if ($indexName) {
                        $table->dropIndex($indexName);
                    } else {
                        $table->dropIndex($columns);
                    }
                });
            });
        } catch (\Throwable $e) {
            // Index might not exist, ignore
        }
    }

    /**
     * Safely add an index
     */
    protected function safeAddIndex(string $table, $columns): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        $columnArray = is_array($columns) ? $columns : [$columns];
        
        // Check if all columns exist
        foreach ($columnArray as $column) {
            if (!Schema::hasColumn($table, $column)) {
                return;
            }
        }

        try {
            DB::transaction(function () use ($table, $columns) {
                Schema::table($table, function (Blueprint $table) use ($columns) {
                    $table->index($columns);
                });
            });
        } catch (\Throwable $e) {
            // Index might already exist, ignore
        }
    }

    /**
     * Safely set a column default value
     */
    protected function safeSetDefault(string $table, string $column, string $defaultValue): void
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
            return;
        }

        try {
            $escapedValue = str_replace("'", "''", $defaultValue);
            DB::statement("ALTER TABLE \"{$table}\" ALTER COLUMN \"{$column}\" SET DEFAULT '{$escapedValue}'");
        } catch (\Throwable $e) {
            // Ignore
        }
    }

    /**
     * Safely drop NOT NULL constraint
     */
    protected function safeDropNotNull(string $table, string $column): void
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
            return;
        }

        try {
            DB::statement("ALTER TABLE \"{$table}\" ALTER COLUMN \"{$column}\" DROP NOT NULL");
        } catch (\Throwable $e) {
            // Ignore
        }
    }

    /**
     * Safely set NOT NULL constraint
     */
    protected function safeSetNotNull(string $table, string $column): void
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
            return;
        }

        try {
            DB::statement("ALTER TABLE \"{$table}\" ALTER COLUMN \"{$column}\" SET NOT NULL");
        } catch (\Throwable $e) {
            // Ignore
        }
    }
}

