import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DropzoneConfigInterface } from 'ngx-dropzone-wrapper';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-video-input',
  templateUrl: './video-input.component.html',
  styleUrls: ['./video-input.component.css']
})
export class VideoInputComponent {
  videoId: string = '';
  videoUrl: SafeResourceUrl = '';
  customMessage = '<div class="flex flex-col items-center justify-center pt-5 pb-6"><svg aria-hidden="true" class="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg><p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Click to upload</span> or drag and drop</p><p class="text-xs text-gray-500 dark:text-gray-400">MP4, GIF</p></div>';
  colorOp: boolean = false;
  scaleOp: boolean = false;
  frameOp: boolean = false;
  videoIsReady: boolean = false;
  fileSelected = false;
  loading: boolean = false;
  showWarningAlert: boolean = false;
  alertAnimation: string = ''; // property to control the CSS class for animation

  public config: DropzoneConfigInterface = {
    url: '/api/upload',
    maxFiles: 1,
    maxFilesize: 400,
    acceptedFiles: 'video/mp4'
  };

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}


  showWarningAlertFunc() {
    this.showWarningAlert = true;
    this.alertAnimation = 'alert-show'; // apply the 'alert-show' CSS class for animation
    setTimeout(() => {
      this.hideWarningAlert();
    }, 5000);
  }

  hideWarningAlert() {
    this.alertAnimation = 'alert-hide'; // apply the 'alert-hide' CSS class for animation
    setTimeout(() => {
      this.showWarningAlert = false;
      this.alertAnimation = ''; // reset the animation class after hiding the alert
    }, 500); // delay hiding the alert to allow time for the animation to complete
  }

  sendOptions() {
    const options = {
      videoId: this.videoId,
      colorOp: this.colorOp,
      scaleOp: this.scaleOp,
      frameOp: this.frameOp
    };
    this.fileSelected = false;
    if (options.colorOp || options.scaleOp || options.frameOp) {
      // Send the options data to the server via HTTP request
      this.loading = true;
  
      // Construct the video URL with the videoId and sanitize it using DomSanitizer
      const videoUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`http://localhost/${options.videoId}.mp4`);
  
      this.http.post('/api/submit', options).subscribe(
        response => {
          // Handle the response from the server
          console.log(response);
          this.colorOp = false;
          this.scaleOp = false;
          this.frameOp = false;
          this.loading = false;
          this.videoIsReady = true;
          this.videoUrl = videoUrl; // Assign the sanitized video URL to the component property
        },
        error => {
          console.error(error);
          this.loading = false; // set isLoading to false on error
          this.fileSelected = true;
          this.showWarningAlertFunc();
        }
      );
    } else {
      this.loading = false;
      this.fileSelected = true;
      this.showWarningAlertFunc();
    }
  }

  public onUploadSuccess(response: any) {
    // Handle response from server after successful upload
    console.log(response[1].newFileName);
    this.videoId = response[1].newFileName; 
    this.fileSelected = true;
  }

  public onUploadError(response: any) {
    // Handle error response from server
    console.log(response);
    this.showWarningAlertFunc();
  }
}