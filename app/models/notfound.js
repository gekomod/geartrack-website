module.exports = function(sequelize, Sequelize) {
    var TrackersIsNot = sequelize.define('notfoundid', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        trackerId: {
            type: Sequelize.TEXT,
            notEmpty: true
        },
    });
    return TrackersIsNot;
}