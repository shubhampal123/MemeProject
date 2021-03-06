const Sequelize = require('sequelize');
require('dotenv').config();

const { DataTypes } = require('sequelize');
const path = `mysql://${process.env.DB_USER}:${process.env.DB_USER_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const db = new Sequelize(path, {
    define: {
        timestamps: false
    }
});

const User = db.define('User', {
    UserId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    Password: {
        type: DataTypes.STRING,
    }
});

//This table contains the Memes which user has liked.
const UserMeme = db.define('UserMeme', {
    MemeId: { //Treated like a foreign key of Meme.MemeId
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    UserMemeLikeness: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            max: 100,
            min: -100
        }
    },
    LastUpdatedAt: {
        type: DataTypes.DATE, //DATETIME in mysql
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
    }

});

User.hasMany(UserMeme, {
    foreignKey: {
        name: 'UserId',
        primaryKey: true,
        allowNull: false,
    }
});

// UserMeme.belongsToMany(Users)
const UserCategory = db.define('UserCategory', {
    CategoryId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    AccessCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    UserActivityCount: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false
    },
    UserCategoryLikeness: {
        type: DataTypes.BIGINT(11),
        defaultValue: 0,
        allowNull: false
    },
});

User.hasMany(UserCategory, {
    foreignKey: {
        name: 'UserId',
        primaryKey: true,
        allowNull: false,
    }
});




module.exports = {
    db,
    User,
    UserMeme,
    UserCategory
};