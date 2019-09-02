const mongoose = require('mongoose');

const { Schema } = mongoose;

const urlSechema = new Schema({
  source: { type: String },
  url: { type: String },
});

const versionSechema = new Schema({
  dramaId: { type: Number },
  engTitle: { type: String },
  chsTitle: { type: String },
  title: { type: String },
  size: { type: String },
  createAt: { type: Date },
  accessCode: { type: String },
  url: [urlSechema],
});

const seasonSechema = new Schema({
  dramaId: { type: Number },
  engTitle: { type: String },
  chsTitle: { type: String },
  seasonId: { type: Number },
  version: [versionSechema],
});

const dramaSechema = new Schema({
  dramaId: { type: Number },
  engTitle: { type: String },
  chsTitle: { type: String },
  pic: {type: String},
  info: { type: String },
  season: [seasonSechema],
});

const dramaModel = mongoose.model('drama', dramaSechema);

async function insert(drama) {
  const created = await dramaModel.create(drama);
  return created;
}
async function findOneAndUpdate(dramaId, content) {
  const result = await dramaModel.findOneAndUpdate(
    {
      dramaId,
    },
    content,
    {
      upsert: true,
      returnNewValue: true,
    },
  );
  return result;
}

async function getOneById(id) {
  const result = await dramaModel.findOne({dramaId:id})
  return result
}


module.exports = {
  insert,
  findOneAndUpdate,
  getOneById,
};
