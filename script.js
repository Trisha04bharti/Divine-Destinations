function locomotiveAnimation() {
  gsap.registerPlugin(ScrollTrigger);

  // Using Locomotive Scroll from Locomotive https://github.com/locomotivemtl/locomotive-scroll

  const locoScroll = new LocomotiveScroll({
    el: document.querySelector("#main"),
    smooth: true,
  });
  // each time Locomotive Scroll updates, tell ScrollTrigger to update too (sync positioning)
  locoScroll.on("scroll", ScrollTrigger.update);

  // tell ScrollTrigger to use these proxy methods for the "#main" element since Locomotive Scroll is hijacking things
  ScrollTrigger.scrollerProxy("#main", {
    scrollTop(value) {
      return arguments.length
        ? locoScroll.scrollTo(value, 0, 0)
        : locoScroll.scroll.instance.scroll.y;
    }, // we don't have to define a scrollLeft because we're only scrolling vertically.
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    },
    // LocomotiveScroll handles things completely differently on mobile devices - it doesn't even transform the container at all! So to get the correct behavior and avoid jitters, we should pin things with position: fixed on mobile. We sense it by checking to see if there's a transform applied to the container (the LocomotiveScroll-controlled element).
    pinType: document.querySelector("#main").style.transform
      ? "transform"
      : "fixed",
  });

  // each time the window updates, we should refresh ScrollTrigger and then update LocomotiveScroll.
  ScrollTrigger.addEventListener("refresh", () => locoScroll.update());

  // after everything is set up, refresh() ScrollTrigger and update LocomotiveScroll because padding may have been added for pinning, etc.
  ScrollTrigger.refresh();
}
locomotiveAnimation();

function navbarAnimation() {
  gsap.to("#nav-part1 svg", {
    transform: "translateY(-100%)",
    scrollTrigger: {
      trigger: "#page1",
      scroller: "#main",
      start: "top 0",
      end: "top -5%",
      scrub: true,
    },
  });
  gsap.to("#nav-part2 #links", {
    transform: "translateY(-100%)",
    opacity: 0,
    scrollTrigger: {
      trigger: "#page1",
      scroller: "#main",
      start: "top 0",
      end: "top -5%",
      scrub: true,
    },
  });
}
navbarAnimation()

function videoconAnimation() {
  var videocon = document.querySelector("#video-container");
  var playbtn = document.querySelector("#play");
  videocon.addEventListener("mouseenter", function () {
    gsap.to(playbtn, {
      scale: 1,
      opacity: 1,
    });
  });
  videocon.addEventListener("mouseleave", function () {
    gsap.to(playbtn, {
      scale: 0,
      opacity: 0,
    });
  });
  document.addEventListener("mousemove", function (dets) {
    gsap.to(playbtn, {
      left: dets.x - 70,
      top: dets.y - 80,
    });
  });
}
videoconAnimation();

function loadinganimation() {
  gsap.from("#page1 h1", {
    y: 100,
    opacity: 0,
    delay: 0.5,
    duration: 0.9,
    stagger: 0.3,
  });
  gsap.from("#page1 #video-container", {
    scale: 0.9,
    opacity: 0,
    delay: 1.3,
    duration: 0.5,
  });
}
loadinganimation();

function cursorAnimation() {
  document.addEventListener("mousemove", function (dets) {
    gsap.to("#cursor", {
      left: dets.x,
      top: dets.y,
    });
  });

  document.querySelectorAll(".child").forEach(function (elem) {
    elem.addEventListener("mouseenter", function () {
      gsap.to("#cursor", {
        transform: "translate(-50%,-50%) scale(1)",
      });
    });
    elem.addEventListener("mouseleave", function () {
      gsap.to("#cursor", {
        transform: "translate(-50%,-50%) scale(0)",
      });
    });
  });
}
cursorAnimation();




document.getElementById("distance-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const useAutoLocation = document.querySelector('input[name="locationOption"]:checked').value === "auto";
  const destination = document.getElementById("destination").value;
  const resultDiv = document.getElementById("result");

  if (useAutoLocation) {
    // Use current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Geocode destination to get coordinates
          geocodeAddress(destination, (destCoords) => {
            calculateDistance([longitude, latitude], destCoords);
          });
        },
        (error) => {
          console.error("Geolocation Error:", error);
          resultDiv.textContent = "Could not retrieve your current location. Please allow location access.";
        }
      );
    } else {
      resultDiv.textContent = "Geolocation is not supported by your browser.";
    }
  } else {
    // Use manually entered origin
    const origin = document.getElementById("origin").value;

    // Geocode origin and destination to get their coordinates
    geocodeAddress(origin, (originCoords) => {
      geocodeAddress(destination, (destCoords) => {
        calculateDistance(originCoords, destCoords);
      });
    });
  }
});

function geocodeAddress(address, callback) {
  const geocodeUrl = `https://api.openrouteservice.org/geocode/search?api_key=5b3ce3597851110001cf624853921689ff984cdd99f3486cc725791c&text=${encodeURIComponent(
    address
  )}`;

  fetch(geocodeUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        callback([lng, lat]);
      } else {
        document.getElementById("result").textContent = `Could not find the location: ${address}. Please check and try again.`;
      }
    })
    .catch((error) => {
      console.error("Geocode API Error:", error);
      document.getElementById("result").textContent = `Error fetching coordinates for: ${address}. Please try again.`;
    });
}

function calculateDistance(originCoords, destCoords) {
  const matrixUrl = "https://api.openrouteservice.org/v2/matrix/driving-car";
  const body = JSON.stringify({
    locations: [originCoords, destCoords],
    metrics: ["distance", "duration"],
  });

  fetch(matrixUrl, {
    method: "POST",
    headers: {
      Authorization: "5b3ce3597851110001cf624853921689ff984cdd99f3486cc725791c",
      "Content-Type": "application/json",
    },
    body: body,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.distances && data.distances[0][1]) {
        const distance = (data.distances[0][1] / 1000).toFixed(2); // Convert meters to kilometers
        const duration = (data.durations[0][1] / 60).toFixed(2); // Convert seconds to minutes
        document.getElementById("result").innerHTML = `Distance: ${distance} km<br>Duration: ${duration} mins`;
      } else {
        document.getElementById("result").textContent = "Error calculating distance. Please try again.";
      }
    })
    .catch((error) => {
      console.error("Matrix API Error:", error);
      document.getElementById("result").textContent = "Error calculating distance. Please try again.";
    });
}

// Toggle between manual and auto location inputs
document.querySelectorAll('input[name="locationOption"]').forEach((radio) => {
  radio.addEventListener("change", function () {
    const manualLocationsDiv = document.getElementById("manual-locations");
    if (this.value === "manual") {
      manualLocationsDiv.style.display = "block";
    } else {
      manualLocationsDiv.style.display = "none";
    }
  });
});




// document.addEventListener("DOMContentLoaded", () => {
//   const carousels = document.querySelectorAll(".carousel");

//   carousels.forEach((carousel) => {
//       let currentIndex = 0;
//       const images = carousel.querySelectorAll("img");

//       // Function to cycle images
//       function cycleImages() {
//           images.forEach((img, index) => {
//               img.classList.remove("active"); // Remove active class
//               if (index === currentIndex) {
//                   img.classList.add("active"); // Add active class to current image
//               }
//           });

//           currentIndex = (currentIndex + 1) % images.length; // Move to the next image
//       }

//       // Start the carousel
//       setInterval(cycleImages, 3000); // Change image every 3 seconds
//   });
// });


// document.addEventListener("DOMContentLoaded", () => {
//   const carousels = document.querySelectorAll(".carousel");

//   carousels.forEach((carousel) => {
//     let currentIndex = 0;
//     const images = carousel.querySelectorAll("img");

//     // Set the first image to be active initially
//     images[currentIndex].classList.add("active");

//     // Function to cycle images
//     function cycleImages() {
//       const previousIndex = currentIndex;
//       currentIndex = (currentIndex + 1) % images.length; // Move to the next image

//       // Remove active class from the previous image and add to the current
//       images[previousIndex].classList.remove("active");
//       images[currentIndex].classList.add("active");
//     }

//     // Start the carousel
//     setInterval(cycleImages, 3000); // Change image every 3 seconds
//   });
// });






  // document.querySelectorAll('.child').forEach(child => {
  //   const firstImage = child.querySelector('.carousel img');
  //   if (firstImage) {
  //     const imageUrl = firstImage.src;
  //     child.style.backgroundImage = `url('${imageUrl}')`;
  //   }
  // });


  document.addEventListener("DOMContentLoaded", () => {
    const carousels = document.querySelectorAll(".carousel");
  
    carousels.forEach((carousel) => {
      let currentIndex = 0;
      const images = carousel.querySelectorAll("img");
      const child = carousel.closest(".child");
  
      // Set the first image to be active initially
      images[currentIndex].classList.add("active");
      if (child) {
        child.style.backgroundImage = `url('${images[currentIndex].src}')`;
      }
  
      // Function to cycle images
      function cycleImages() {
        const previousIndex = currentIndex;
        currentIndex = (currentIndex + 1) % images.length; // Move to the next image
  
        // Remove active class from the previous image and add to the current
        images[previousIndex].classList.remove("active");
        images[currentIndex].classList.add("active");
  
        // Update the background image of the parent `.child`
        if (child) {
          child.style.backgroundImage = `url('${images[currentIndex].src}')`;
        }
      }
  
      // Start the carousel
      setInterval(cycleImages, 3000); // Change image every 3 seconds
    });
  });
  


