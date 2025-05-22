// db/migrations/1741721829012-AddOwnership.js
module.exports = {
    async up(db) {
      await db.createTable('ownership', {
        id:       'varchar(255) not null primary key',
        owner:    'varchar(255) not null',
        contract: 'varchar(255) not null',
        tokenId:  'varchar(255) not null'
      });
    },
    async down(db) {
      await db.dropTable('ownership');
    }
  };
  