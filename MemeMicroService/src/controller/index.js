const { MemeUploaderSVC, GetTrendingMemesSVC, LikeUpdaterSVC, CategoryUploaderSVC, GetCategoriesForMemeSVC, GetRecommendedMemesSVC } = require('../services');
const memeUploaderSVC = new MemeUploaderSVC();
const getTrendingMemesSVC = new GetTrendingMemesSVC();
const categoryUploaderSVC = new CategoryUploaderSVC();
const likeUpdaterSVC = new LikeUpdaterSVC();
const getCategoriesForMemeSVC = new GetCategoriesForMemeSVC();
const getRecommendedMemesSVC = new GetRecommendedMemesSVC();
const axios = require('axios');
const constants = require('../constants');
const fs = require('fs');
require("dotenv").config();

/*
  Input: UserId, MemeId, OldMemeLikeness, NewMemeLikeness 
*/
const likeMeme = async (req, res, next) => {
  console.log("Inside likeMeme controller");
  try {
    const categoryIdList = await getCategoriesForMemeSVC.getCategoriesForMeme(req.body.MemeId);
    const deltaMemeLikeness = req.body.NewMemeLikeness - req.body.OldMemeLikeness;
    let deltaActivityCount = (req.body.OldMemeLikeness === 0 && req.body.NewMemeLikeness !== 0) ? 1 : 0;
    if (req.body.OldMemeLikeness !== 0 && req.body.NewMemeLikeness === 0) {
      deltaActivityCount = -1; //if we create meter likeness
    }
    const updateObj = {
      MemeId: req.body.MemeId,
      CategoryIdList: categoryIdList,
      DeltaMemeLikeness: deltaMemeLikeness,
      DeltaActivityCount: deltaActivityCount
    };
    const preferencesObj = {
      UserId: req.body.UserId,
      MemeId: req.body.MemeId,
      NewMemeLikeness: req.body.NewMemeLikeness,
      CategoryIdList: categoryIdList
    };
    const results = await Promise.all([
      likeUpdaterSVC.update(updateObj),
      axios.post(process.env.USER_MS + "api/userPreferenceUpdater", preferencesObj)
    ]);
    if (results[0] && results[1].status === 200) {
      res.status(200).send({
        data: {
          message: "Like/Dislike Operation successfull"
        }
      });
    } else {
      console.log("Error in likeUpdater or userPreferenceUpdater");
      res.status(500).send({
        code: 500,
        message: "Error in like Meme"
      });
    }
  } catch (err) {
    console.log("Error caught in likeMeme controller");
    next(err);
  }
}

/*
  DOES POST PROCESSING OF UPLOAD MEME
  1. call CategoryDecider_MS
  2. upload categories and 3. update user preference
*/
const memeUploadHelper = async (userId, memeId, mediaPath, mediaType) => { //TODO: need to test
  console.log("Inside memeUploadHelper controller");
  try {
    // Call CategoryMicroService to get CategoryIdList of a particular Meme 
    const memeUrl = process.env.MEME_MS + "media/" + mediaPath;
    const categoryIdList = await axios.post(process.env.CATEGORY_MS + "api/getCategories", { MemeUrl: memeUrl, MediaType: mediaType });
    const preferencesObj = {
      UserId: userId,
      MemeId: memeId,
      NewMemeLikeness: constants.NEW_MEME_LIKENESS_DEFAULT, //User will like the meme which he uploads
      CategoryIdList: categoryIdList
    };
    await Promise.all[
      categoryUploaderSVC.upload(memeId, categoryIdList),
      axios.post(process.env.USER_MS + "api/userPreferenceUpdater", preferencesObj)
    ];
    console.log("memeUploadHelper successfull");
  } catch (err) {
    console.log("Error caught in memeUploadHelper");
    throw err;
  }
}

/*
  Stores media generates media name, media path
  Input: MemeTitle, UploadedBy(UserId), TagString
  Output: MediaPath, MemeId --> This should be unique
*/
//TODO : update Category   Activity , MemeCategory
const upload = async (req, res, next) => {
  console.log("Inside upload controller");
  try {
    console.log(req.body);
    console.log(req.files.mediaFile);
    const memeObj = req.body;
    const result = await memeUploaderSVC.upload(memeObj, req.files.mediaFile);
    memeUploadHelper(req.body.UploadedBy, result.MemeId, result.MediaPath, result.MediaType); //If throws error => mp unhandled promise rejection
    res.status(200).send({
      data: result
    });
  } catch (err) {
    console.log("Error caught in upload");
    next(err);
  }
}

//upload, categoryDeciderHelper (In turn calls Category_MS), updateUserPreferences 


/*
    Input: pageNo, pageSize
    Ouput: List of memes = { MemeId, MemeTitle, ActualData }
*/
const getTrendingMemes = async (req, res, next) => {
  console.log("Inside fetchTrendingMemems controller");
  try {
    const memeList = await getTrendingMemesSVC.getTrendingMemes(req.body.pageNo, req.body.pageSize);
    res.status(200).send({
      data: memeList
    });
  } catch (err) {
    console.log("Error caught in getTrendingMemes controller");
    next(err);
  }
}

const getUserCategories = async (req, res, next) => {
  console.log("Inside getUserCategories controller");
  console.log(req.body);
  axios.defaults.headers.common["Authorization"] = req.get('Authorization');
  try {
    
    const result = await axios.get(process.env.USER_MS + `api/userCategories/${req.body.UserId}`);
    req.body.UserCategories = result.data.data.userCategories;
    console.log('User Categories :'+result.data.data.userCategories);
    next();
  } catch (err) {
    console.log("Error caught in getUserCategories controller");
    next(err);
  }
}

/*
  UserCategories --> Categories converted to Memes --> UserMemes 
  Input: UserId, pageNo, pageSize
  Output: List of memes
*/
const getRecommendedMemes = async (req, res, next) => {
  console.log("Inside getRecommendedMemes controller");
  try {
    const { pageNo, pageSize, UserCategories } = req.body;
    const memeList = await getRecommendedMemesSVC.getRecommendedMemes(pageNo, pageSize, UserCategories);
    res.status(200).send({
      data: memeList
    });
  } catch (err) {
    console.log("Error caught in getRecommendedMemes controller");
    next(err);
  }
}

module.exports = {
  upload,
  getTrendingMemes,
  getRecommendedMemes,
  likeMeme,
  getUserCategories
};