"use client";
/* eslint-disable react/no-unescaped-entities */
import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { storage } from "@/Api/services/firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { gripModel } from "@/Api/services/baller";

const Camera = () => {
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [captureloading, setCaptureLoading] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchCamera = async () => {
      try {
        // Request permission to access cameras
        await navigator.mediaDevices.getUserMedia({ video: true });

        // Fetch available cameras
        const availableCameras =
          await navigator.mediaDevices.enumerateDevices();
        const videoDevices = availableCameras.filter(
          (device) => device.kind === "videoinput"
        );
        setCameras(videoDevices);
        setSelectedCamera(videoDevices[0]?.deviceId || null);
      } catch (error) {
        console.error("Error accessing cameras: ", error);
      }
    };

    fetchCamera();
  }, []);


  // Function to capture photo
  const capturePhoto = async () => {
    setLoading(true);
    const video = webcamRef.current?.video;
    if (!video) {
      setLoading(false);
      alert("Webcam video element not found.");
      console.error("Webcam video element not found.");
      return;
    }

    // Create a canvas element to draw the image onto
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Draw the current frame from the video onto the canvas
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas content to a data URL representing the image
    const imageDataUrl = canvas.toDataURL("image/jpeg");

    // Convert the data URL to a Blob object
    const blob = await fetch(imageDataUrl).then((res) => res.blob());

    // Create a file from the Blob object
    const timestamp = Date.now();
    const imageFileName = `captured-image-${timestamp}.jpg`;
    const imageFile = new File([blob], imageFileName, { type: "image/jpeg" });


    // Upload the image file to Firebase Storage
    const storageRef = ref(storage, "balling_grip/");
    const imageRef = ref(storage, `balling_grip/${imageFile.name}`);
    const uploadTask = uploadBytesResumable(imageRef, imageFile);

    uploadTask.on(
      "state_changed",
      (snapshot: { bytesTransferred: number; totalBytes: number; }) => {
        // Handle upload progress
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      },
      (error: any) => {
        // Handle upload error
        setLoading(false);
        console.error("Upload failed:", error);
        alert("An error occurred in uploading");
      },
      () => {
        // Upload completed successfully, get the download URL
        getDownloadURL(imageRef)
          .then(async (downloadUrl: any) => {
            // Do something with the download URL
            setLoading(false);
            alert("Image uploaded successfully");
          })
          .catch((error: any) => {
            // Handle getting download URL error
            setLoading(false);
            console.error("Error getting download URL:", error);
            alert("An error occurred while getting download URL");
          });
      }
    );
    // Wait for the upload to complete
    await uploadTask;

    // Get the URL of the uploaded image
    const downloadUrl = await getDownloadURL(imageRef);

    // Call the grip model API
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
    await gripModel(downloadUrl)
      .then((response: any) => {
        console.log("Grip model API response:", response.data);
        setLoading(false);
      })
      .catch((error: any) => {
        setLoading(false);
        console.error("Error in grip model API:", error);
        alert("An error occurred in grip analysis. Please try again.");
      });
  };

  // Function to handle camera change
  const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCamera(event.target.value);
  };



  return (
    <div className={`bg-black bg-cover bg-center h-screen   overflow-y-auto`}>

          <div className="flex flex-row flex-wrap w-screen h-28 z-10 absolute justofy-center md:justify-evenly">
            <select
              aria-label="Select Camera"
              value={selectedCamera || ""}
              onChange={handleCameraChange}
              className="w-20 md:w-72 h-9 bg-white text-black rounded-md m-3 p-2 text-sm md:text-lg font-bold 
        shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50"
            >
              {cameras.map((camera) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label}
                </option>
              ))}
            </select>
          </div>
      <div className="flex items-center justify-center h-screen w-full absolute z-0">
        <Webcam
          audio={false}
          ref={webcamRef}
          videoConstraints={{
            width: 1280,
            height: 720,
            deviceId: selectedCamera || undefined,
          }}
          className="w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="w-full h-full absolute top-0 left-0"
        />
      </div>
      <button
        className="absolute rounded-3xl bottom-0 left-1/2 transform -translate-x-1/2 mb-8 w-14 h-16 bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-lg font-bold transition-all duration-300 hover:from-violet-500 hover:to-fuchsia-500 outline outline-offset-2 outline-pink-500 flex items-center justify-center"
        onClick={capturePhoto}
        disabled={captureloading || loading}
      >
        {/* Capture */}
      </button>
 
    </div>
  );
}

export default Camera;