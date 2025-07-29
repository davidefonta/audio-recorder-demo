import { NgFor } from '@angular/common';
import {Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef} from '@angular/core';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';


@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css'],
  imports:[NgFor]
})
export class AppComponent implements OnInit {
	mediaRecorder?:MediaRecorder;
	chunks: Blob[] = [];
	audioFiles:SafeUrl[] = [];

	wakeLock: WakeLockSentinel | null = null;

	constructor(private cd: ChangeDetectorRef, private dom: DomSanitizer) {}
	ngOnInit() {

		document.addEventListener('visibilitychange', async () => {
			if(this.wakeLock){
				if(document.visibilityState === 'hidden' ){
					this.releaseWakeLock(this.wakeLock) 
				} else {
					this.wakeLock = await this.getWakeLock();

				}

			}
		});

		navigator.mediaDevices.getUserMedia(
			{audio: true}).then(
			stream => {
				console.log(stream);
        const options = {
          audioBitsPerSecond: 128000,
          // videoBitsPerSecond: 2500000,
          mimeType: 'audio/mp4; codecs="mp4a.40.2"',
		//   mimeType: 'audio/webm;codecs=opus'
        };
		if (!MediaRecorder.isTypeSupported(options.mimeType)) {
			const fallback = 'audio/ogg;codecs=opus';
            console.warn(`${options.mimeType} not supported. Falling back to ${fallback}`);
            options.mimeType = fallback;
        }
				this.mediaRecorder = new MediaRecorder(stream, options);

				this.mediaRecorder.onstart = async () => {
					this.wakeLock = await this.getWakeLock();
				}

				this.mediaRecorder.onerror = (err) => {
					this.wakeLock = this.releaseWakeLock(this.wakeLock);
					console.error("MediaRecorder onerror", err);
				}

				this.mediaRecorder.onstop = () => {
					console.log('data available after MediaRecorder.stop() called.');
					this.wakeLock = this.releaseWakeLock(this.wakeLock);

					// var clipName = prompt('Enter a name for your sound clip');

					// var clipContainer = document.createElement('article');
					// var clipLabel = document.createElement('p');
					// var audio = document.createElement('audio');
					// var deleteButton = document.createElement('button');

					// clipContainer.classList.add('clip');
					// audio.setAttribute('controls', '');
					// deleteButton.innerHTML = 'Delete';
					// clipLabel.innerHTML = clipName;

					// clipContainer.appendChild(audio);
					// clipContainer.appendChild(clipLabel);
					// clipContainer.appendChild(deleteButton);
					// soundClips.appendChild(clipContainer);

					// audio.controls = true;
					var blob = new Blob(this.chunks, {type: options.mimeType});
					this.chunks = [];
					var audioURL = URL.createObjectURL(blob);
					// audio.src = audioURL;
					this.audioFiles.push(this.dom.bypassSecurityTrustUrl(audioURL));
					console.log(audioURL);
					console.log('recorder stopped');
					this.cd.detectChanges();
				};
				this.mediaRecorder.ondataavailable = e => {
					this.chunks.push(e.data);
				};
			}).catch(
			(e) => {
        console.error(e);
				// alert('Error capturing audio.');
			},
		);
	}

	startRecording() {
		this.mediaRecorder?.start();
		console.log(this.mediaRecorder?.state);
		console.log('recorder started');
	}

	stopRecording() {
		this.mediaRecorder?.stop();
		console.log(this.mediaRecorder?.state);
		console.log('recorder stopped');
	}

	async getWakeLock():Promise<WakeLockSentinel | null> {
		// create an async function to request a wake lock
		let wakeLock: WakeLockSentinel | null = null
		if("wakeLock" in navigator) {
			try {
				wakeLock = await navigator.wakeLock.request("screen");
				console.log('Wake Lock taken')

			} catch (err) {
				console.warn('Can\'t get wake Lock', err)
			}
		} else {
			console.warn("Wake lock is not supported by this browser.");
		}
		return wakeLock;
	}

	releaseWakeLock(wakeLock:WakeLockSentinel | null): null {
		if(wakeLock) {
			wakeLock.release();
			console.log('Wake Lock released');
		}
		return null

	}

	
}
