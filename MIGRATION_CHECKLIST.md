# Migration Safety Checklist for PostgreSQL

## ✅ Quick Checklist

When creating or updating migrations, ensure:

1. **Use `MigrationSafe` trait** - `use App\Database\MigrationSafe;`
2. **Wrap operations in separate transactions** - Each `safe*()` method handles this automatically
3. **Check table/column existence** - Use `Schema::hasTable()` and `Schema::hasColumn()` before operations
4. **Never use `enum()`** - Use `string()` + `safeAddCheckConstraint()` instead
5. **Never use `MODIFY COLUMN`** - Use `safeDropCheckConstraint()` + `safeAddCheckConstraint()` for enum changes
6. **Never drop without checking** - Use `safeDropColumn()`, `safeDropForeign()`, `safeDropIndex()`
7. **Always use `IF EXISTS`** - The trait methods handle this automatically
8. **Quote identifiers properly** - The trait methods handle this automatically

## 🔧 Common Patterns

### Adding Enum-like Column
```php
if (!Schema::hasColumn('table', 'status')) {
    $this->safeAddColumn('table', function (Blueprint $table) {
        $table->string('status')->nullable();
    });
    $this->safeAddCheckConstraint('table', 'status', ['value1', 'value2'], 'table_status_check');
    $this->safeSetDefault('table', 'status', 'value1');
}
```

### Updating Enum Values
```php
$this->safeDropCheckConstraint('table', 'status');
$this->safeAddCheckConstraint('table', 'status', ['new1', 'new2'], 'table_status_check');
```

### Adding Foreign Key
```php
if (!Schema::hasColumn('table', 'foreign_id')) {
    $this->safeAddColumn('table', function (Blueprint $table) {
        $table->unsignedBigInteger('foreign_id')->nullable();
    });
    $this->safeAddForeign('table', 'foreign_id', 'other_table', 'id', 'cascade');
}
```

### Dropping Column with Foreign Key
```php
$this->safeDropForeign('table', 'foreign_id');
$this->safeDropColumn('table', 'foreign_id');
```

### Adding Index
```php
if (Schema::hasColumn('table', 'col1') && Schema::hasColumn('table', 'col2')) {
    $this->safeAddIndex('table', ['col1', 'col2']);
}
```

## 🚫 Common Mistakes to Avoid

1. ❌ Using `enum()` directly - PostgreSQL doesn't support it
2. ❌ Using `MODIFY COLUMN` - MySQL syntax, not PostgreSQL
3. ❌ Dropping columns without checking existence
4. ❌ Not wrapping operations in separate transactions
5. ❌ Using `->change()` on enum columns
6. ❌ Dropping foreign keys without checking
7. ❌ Not handling partial migration failures

## 📋 MigrationSafe Trait Methods

- `safeTable($table, $callback)` - Execute schema operation in separate transaction
- `safeDropColumn($table, $columns)` - Drop columns if they exist
- `safeAddColumn($table, $callback)` - Add column if it doesn't exist
- `safeDropForeign($table, $columns)` - Drop foreign key if it exists
- `safeAddForeign($table, $column, $referencesTable, $referencesColumn, $onDelete)` - Add foreign key safely
- `safeDropCheckConstraint($table, $column)` - Drop CHECK constraints on column
- `safeAddCheckConstraint($table, $column, $allowedValues, $constraintName)` - Add CHECK constraint
- `safeDropIndex($table, $columns, $indexName)` - Drop index if it exists
- `safeAddIndex($table, $columns)` - Add index if columns exist
- `safeSetDefault($table, $column, $defaultValue)` - Set column default value
- `safeDropNotNull($table, $column)` - Drop NOT NULL constraint
- `safeSetNotNull($table, $column)` - Set NOT NULL constraint

## ✅ All Fixed Migrations

The following migrations have been updated to use `MigrationSafe`:

- ✅ `2025_09_26_145236_update_job_applications_table_add_statuses.php`
- ✅ `2025_09_26_161244_add_fired_status_to_job_applications.php`
- ✅ `2025_10_17_160000_update_is_reviewed_enum_in_workers_table.php`
- ✅ `2025_11_05_083426_update_job_type_enum_add_per_day_per_job_to_jobposts_table.php`
- ✅ `2025_10_13_063925_add_salary_type_and_update_job_type_in_jobposts_table.php`
- ✅ `2025_11_07_000000_remove_time_in_time_out_from_bookings_and_booking_requests_tables.php`
- ✅ `2025_10_13_064106_remove_company_id_from_jobposts_table.php`
- ✅ `2025_11_06_103427_fix_jobposts_profile_id_foreign_key.php`
- ✅ `2025_10_20_184522_remove_unnecessary_fields_from_booking_requests_table.php`
- ✅ `2025_10_20_183650_add_bookmodal_fields_to_booking_requests_table.php`
- ✅ `2025_11_07_070000_change_work_type_to_string_in_booking_requests_table.php`

## 🎯 Testing Checklist

Before deploying:

1. ✅ Run `php artisan migrate:fresh` - Should complete without errors
2. ✅ Run `php artisan migrate:rollback` - Should rollback without errors
3. ✅ Run `php artisan migrate` again - Should re-apply without errors
4. ✅ Test in Docker/PostgreSQL environment
5. ✅ Verify all tables/columns exist after migration

