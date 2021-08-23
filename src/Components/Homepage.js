import React, { Component } from "react";
import axios from "axios";
import { storage } from "../cloudstorage";
import Progress from "./Progress";

export default class Homepage extends Component {
  constructor(props) {
    super(props);
    this.onValueChange = this.onValueChange.bind(this);
    this.processImageInAzureOCR = this.processImageInAzureOCR.bind(this);
    this.onImageUploadToCloud = this.onImageUploadToCloud.bind(this);
    this.state = {
      imageUrl: "https://ichef.bbci.co.uk/images/ic/1200x675/p07y9mzq.jpg",
      lines: null,
      uploadPercentage: 0,
    };
  }

  onValueChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  onImageUploadToCloud = (file) => {
    if (file !== null) {
      const uploadTask = storage.ref(`OCRImages/${file.name}`).put(file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          //progress function
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          this.setState({ uploadPercentage: progress });
        },
        (error) => {
          //error function
          console.log(error);
        },
        () => {
          //complete function
          storage
            .ref("OCRImages")
            .child(file.name)
            .getDownloadURL()
            .then((url) => {
              this.setState({ imageUrl: url });
              this.processImageInAzureOCR(url);
            });
        }
      );
    } else {
      alert("First You Must Select An Image");
    }
  };

  processImageInAzureOCR = (covertImageUrl) => {
    const config = {
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": "0d53257411944c778237adc1b6b263c1",
      },
    };
    const ImageToCovertObject = {
      url: covertImageUrl,
    };
    axios
      .post(
        "https://eastus.api.cognitive.microsoft.com/vision/v3.0/ocr?language=unk&detectOrientation=true",
        ImageToCovertObject,
        config
      )
      .then((response) => {
        this.setState({ lines: response.data.regions[0].lines });
      })
      .catch((err) => {
        alert(err);
      });
  };

  render() {
    return (
      <div className="p-5 mt-5">
        <div className="container">
          <div>
            <form>
              <div className="mb-3 text-center">
                <img
                  src={this.state.imageUrl}
                  style={{ width: "500px" }}
                  alt="covertimg"
                />
              </div>
              <div className="mb-3">
                <input
                  type="file"
                  className="form-control"
                  id="imageUrl"
                  name="imageUrl"
                  onChange={(e) => {
                    this.onImageUploadToCloud(e.target.files[0]);
                  }}
                />
                <div className="mt-3">
                  <Progress percentage={this.state.uploadPercentage} />
                </div>
              </div>
            </form>
          </div>
          <hr/>
          <div className="mt-3">
            {this.state.lines ? (
              <p>
                {" "}
                {this.state.lines.map((line) => {
                  return (
                    <h6>
                      {line.words.map((words) => {
                        return " " + words.text;
                      })}
                    </h6>
                  );
                })}
              </p>
            ) : (
              <div>
                <p className="text-center">
                  Extract text from images (JPG, PNG) and convert into editable
                  Text output format
                </p>
                <h6 className="text-center">
                  Developed by Senura Vihan Jayadeva
                </h6>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
