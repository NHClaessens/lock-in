import './App.css';
import { Flex, useColorMode, Icon } from '@chakra-ui/react';
import AudioMixer from './Components/AudioMixer';

// function AudioSource() {
//   const predefined = [
//     "mozart.mp3",
//     "bible.mp3",
//   ]

//   const basic = {
//     path: "mozart.mp3",
//     volume: 1,
//     stereo: 0,
//     speed: 1,
//   }

//   const parseAudioItemsFromURL = () => {
//     const queryParams = new URLSearchParams(window.location.search);
//     const data = queryParams.get("data");
  
//     if (data) {
//       try {
//         return JSON.parse(decodeURIComponent(data));
//       } catch (error) {
//         console.error("Error parsing audio items from URL", error);
//       }
//     }
//     return []; // Return a default value if URL doesn't have valid data
//   };

//   const [ audioItems, setAudioItems ] = useState(parseAudioItemsFromURL)
//   const [ pos, setPos ] = useState([])

//   const updateURL = (audioItems) => {
//     const queryParams = new URLSearchParams();
//     queryParams.set("data", encodeURIComponent(JSON.stringify(audioItems)));
//     window.history.pushState(null, null, "?" + queryParams.toString());
//   };
//   useEffect(() => updateURL(audioItems), [audioItems])

  

//   const [audioSources, setAudioSources] = useState([]);

//   useEffect(() => {
//     const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
//     const sources = audioItems.map((item, index) => {
//       const audioElement = new Audio(item.path);
//       audioElement.playbackRate = item.speed

//       audioElement.addEventListener('canplay', () => {
//         if(pos[index])
//           audioElement.currentTime = pos[index]
//         else if(audioElement.paused)
//           audioElement.play();
//       });

//       const sourceNode = audioCtx.createMediaElementSource(audioElement);
//       const gainNode = audioCtx.createGain();
//       const pannerNode = audioCtx.createStereoPanner();

//       gainNode.gain.value = item.volume;
//       pannerNode.pan.value = item.stereo;

//       sourceNode.connect(gainNode).connect(pannerNode).connect(audioCtx.destination);

//       return { audioElement, sourceNode, gainNode, pannerNode };
//     });

//     setAudioSources(sources);

//     return () => {
//       const positions = audioSources.map((source, index) => {
//         if(source.audioElement.currentTime > 0 || !pos[index])
//           return source.audioElement.currentTime
//         else
//           return pos[index]
//       });

//       console.log(positions)
//       setPos(positions)
//       // Clean up audio sources when component unmounts or audioItems change
//       sources.forEach(source => {
//         source.audioElement.pause();
//         source.sourceNode.disconnect();
//         source.gainNode.disconnect();
//         source.pannerNode.disconnect();
//       });
//     };
//   }, [audioItems]);

//   const addSource = () => {
//     setAudioItems([...audioItems, basic])
//   }

//   const removeSource = (index) => {
//     setAudioItems(currentItems => {
//       return currentItems.filter((_, idx) => idx !== index);
//     })
//   }

//   const playAll = () => {
//     audioSources.forEach(source => source.audioElement.play());
//   };

//   const pauseAll = () => {
//     audioSources.forEach(source => source.audioElement.pause());
//   };

//   const setVolumeForAll = (volume) => {
//     audioSources.forEach(source => source.gainNode.gain.value = volume);
//   };

//   const setVolumeForSource = (index, volume) => {
//     if (audioSources[index]) {
//       audioSources[index].gainNode.gain.value = volume;
//       setAudioSources(audioSources)
//     }
//   };

//   const setPanningForSource = (index, stereo) => {
//     if (audioSources[index]) {
//       audioSources[index].pannerNode.pan.value = stereo;
//       setAudioSources(audioSources)
//     }
//   };

//   const setSpeedForSource = (index, speed) => {
//     audioItems[index].speed = speed;
//     setAudioItems(current => {
//       return current.map((item, idx) => {
//         return item;
//       });
//     });
//   };

//   const setPathForSource = (index, path) => {
//     if (audioItems[index]) {
//       console.log("SET" + path)
//       const newAudioItems = audioItems.map((item, idx) => 
//         idx === index ? { ...item, path: path } : item
//       );
//       setAudioItems(newAudioItems)
//     }
//   }

//   return (
//     <Box w="100dvw" h="100dvh" display="flex" flexDir="column" p="16px" gap="16px">
//       <Button onClick={() => playAll()}>play</Button>
//       <SimpleGrid minChildWidth="180px" gap="16px">

//       {audioItems.map((item, index) => {
//         return <Card key={index} p="16px" gap="16px">
//           <Box position="absolute" top="-5px" right="-5px" bg="blue.500" color="white" w="20px" h="20px" textAlign="center" verticalAlign="center" borderRadius="8px" cursor="pointer"
//             onClick={() => removeSource(index)}
//           >
//             X
//           </Box>
//           <Text>File path</Text>
//           {/* <Input value={item.path} onChange={(e) => setPathForSource(index, e.target.value)}/> */}
//           <Select placeholder='Select option' value={audioItems[index].path} onChange={(e) => {setPathForSource(index, e.target.value)}}>
//             {predefined.map((item,index) => {
//               return <option value={item} key={index}>{item}</option>
//             })}
//           </Select>
//           <Text>Speed</Text>
//           <Input type="number" value={audioSources[index]?.audioElement.playbackRate ?? 1} min={0.5} max={16} onChange={(e) => {
//             let val = parseFloat(e.target.value)
//             if (val >= 0.0625 && val <= 16) {
//               setSpeedForSource(index, val)
//             }
//           }}/>
//           <Slider aria-label='slider-ex-1' defaultValue={audioItems[index].speed} min={0.0625} max={2} step={0.01} onChange={(val) => setSpeedForSource(index, val)}>
//             <SliderTrack>
//               <SliderFilledTrack />
//             </SliderTrack>
//             <SliderThumb />
//           </Slider>
//           <Text>Stereo</Text>
//           <Slider aria-label='slider-ex-1' defaultValue={audioItems[index.stereo]} min={-1} max={1} step={0.01} onChange={(val) => setPanningForSource(index, val)}>
//             <SliderTrack>
//               <SliderFilledTrack />
//             </SliderTrack>
//             <SliderThumb />
//           </Slider>
//           <Text>Volume</Text>
//           <Slider aria-label='slider-ex-1' defaultValue={audioItems[index].volume} min={0} max={1} step={0.01} onChange={(val) => setVolumeForSource(index, val)}>
//             <SliderTrack>
//               <SliderFilledTrack />
//             </SliderTrack>
//             <SliderThumb />
//           </Slider>
//         </Card>
//       })}
//       </SimpleGrid>
//       <Button onClick={addSource}>Add source</Button>
//     </Box>
//   );
// }

function App() {
  const { colorMode, toggleColorMode } = useColorMode()
  return <>
    <Flex justify="end">
        <Icon m="16px 16px 0 0" viewBox='0 0 24 24' fill={colorMode === 'dark' ? 'white' : 'black'}
          onClick={toggleColorMode} cursor="pointer"
        >
        <path xmlns="http://www.w3.org/2000/svg" d="M12,22 C17.5228475,22 22,17.5228475 22,12 C22,6.4771525 17.5228475,2 12,2 C6.4771525,2 2,6.4771525 2,12 C2,17.5228475 6.4771525,22 12,22 Z M12,20.5 L12,3.5 C16.6944204,3.5 20.5,7.30557963 20.5,12 C20.5,16.6944204 16.6944204,20.5 12,20.5 Z"></path>
        </Icon>
    </Flex>
    <AudioMixer/>
  </>

}

export default App;
