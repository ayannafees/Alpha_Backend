import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

     //TODO: get all videos based on query, sort, pagination
    
    const filter = {};

    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
        ];
    }

    if (userId) {
        filter.owner = userId;
    }

    const sort = { [sortBy]: sortType === 'asc' ? 1 : -1 };

    const videos = await Video.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const totalVideos = await Video.countDocuments(filter);
    const totalPages = Math.ceil(totalVideos / limit);

    res.status(200).json(new ApiResponse(200, { videos, totalPages, totalVideos }, 'Videos retrieved successfully'));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    
    if (!title || !description) {
        throw new ApiError(400, 'Both title and description are required.');
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, 'Video file is required.');
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, 'Thumbnail file is required.');
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
        throw new ApiError(500, 'Error while uploading video file to Cloudinary.');
    }
    if (!thumbnail) {
        throw new ApiError(500, 'Error while uploading thumbnail file to Cloudinary.');
    }

    const duration = videoFile.duration;
    const owner = req.user?._id;

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration,
        owner
    });

    if (!video) {
        throw new ApiError(500, 'Something went wrong while publishing the video.');
    }

    return res.status(201).json(new ApiResponse(201, video, 'Video published successfully'));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID.');
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, 'Video not found.');
    }

    res.status(200).json(new ApiResponse(200, video, 'Video retrieved successfully'));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnailFile = req.files?.thumbnail?.[0];

    // Check if at least one of title or description is provided
    if (!title && !description) {
        throw new ApiError(400, 'At least one of title or description is required.');
    }

    // Check if a thumbnail file is provided
    if (!thumbnailFile) {
        throw new ApiError(400, 'Thumbnail file is required.');
    }

    const thumbnailLocalPath = thumbnailFile.path;

    // Upload thumbnail to Cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
        throw new ApiError(500, 'Error while uploading thumbnail file to Cloudinary.');
    }

    // Update video details
    const updatedFields = {};
    if (title) updatedFields.title = title;
    if (description) updatedFields.description = description;
    updatedFields.thumbnail = thumbnail;

    const video = await Video.findByIdAndUpdate(
        videoId,
        { $set: updatedFields },
        { new: true }
    );

    if (!video) {
        throw new ApiError(404, 'Video not found.');
    }

    return res.status(200).json(new ApiResponse(200, video, 'Video updated successfully'));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID.');
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, 'Video not found.');
    }

    console.log(video)
    // Delete the video file and thumbnail from Cloudinary
    const videoDeletionResponse = await deleteFromCloudinary(video.videoFile,"video");
    const thumbnailDeletionResponse = await deleteFromCloudinary(video.thumbnail,"image");

    if (!videoDeletionResponse || !thumbnailDeletionResponse) {
        throw new ApiError(500, 'Error deleting files from Cloudinary.');
    }

    // Delete the video record from the database
    await Video.findByIdAndDelete(videoId);

    res.status(200).json(new ApiResponse(200, {}, 'Video deleted successfully'));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, 'Video not found.');
    }

    const videoNew = await Video.findByIdAndUpdate(
        videoId,
        { 
            $set: {
                isPublished: !video.isPublished
            } 
        },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, videoNew, 'Publish status toggled successfully'));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}   