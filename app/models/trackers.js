module.exports = function(sequelize, Sequelize) {
    var Trackers = sequelize.define('trackers', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        trackerId: {
            type: Sequelize.TEXT,
            notEmpty: true
        },
        description: {
            type: Sequelize.STRING,
            notEmpty: true
        },
        postCode: {
            type: Sequelize.STRING,
            notEmpty: false
        },
	userId: {
            type: Sequelize.INTEGER,
            notEmpty: true
        },
        status: {
            type: Sequelize.ENUM('active', 'inactive'),
            defaultValue: 'active'
        }
    });
    return Trackers;
}