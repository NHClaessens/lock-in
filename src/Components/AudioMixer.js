import { Flex, Button, Card, Select, SimpleGrid, Text, Input, Slider, SliderTrack, SliderFilledTrack, SliderThumb, useDisclosure, Icon, useColorMode } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import MissingFileModal from "./MissingFileModal";

export default function AudioMixer() {
    const [audioContext ] = useState(new (window.AudioContext || window.webkitAudioContext)())

    const [ sources, setSources ] = useState([])
    const [ sourceOptions, setSourceOptions ] = useState([
        {
            name: "Mozart",
            path: "mozart.mp3"
        },
        {
            name: "Bible in Chinese",
            path: "bible.mp3"
        }
    ])
    const [ settings, setSettings ] = useState([])
    const defaultSettings = {
        volume: 1,
        speed: 1,
        stereo: 0,
        paused: true,
    }

    const [ players, setPlayers ] = useState([])

    // ask users to replace files that cannot be found
    const [ toReplace, setToReplace ] = useState([])
    async function checkBlobUrl(url) {
        try{
            return fetch(url)
            .then(response => {
                if (response.ok) {
                    return true;
                }
                throw new Error('Blob not found');
            })
            .catch(() => {
                return false;
            });
        } catch(error) {
            return false
        }
    }

    let modal = useDisclosure()

    function getReplacement(source, index) {
        setToReplace([...toReplace, {source: source, index: index}])
    }

    function createPlayer(source, setting) {
        const audioElement = new Audio(source.path)
        audioElement.loop = true
        const sourceNode = audioContext.createMediaElementSource(audioElement)
        const gainNode = audioContext.createGain()
        const pannerNode = audioContext.createStereoPanner()

        if(setting) {
            audioElement.playbackRate = setting.speed
            gainNode.gain.value = setting.volume
            pannerNode.pan.value = setting.stereo
        }

        sourceNode.connect(gainNode).connect(pannerNode).connect(audioContext.destination);

        return { audioElement, sourceNode, gainNode, pannerNode }
    }

    function addSource() {
        let player = createPlayer(sourceOptions[0], defaultSettings)
        setPlayers([...players, player])

        setSources([...sources, sourceOptions[0]])
        setSettings([...settings, defaultSettings])
    }

    const parseURL = () => {
        const queryParams = new URLSearchParams(window.location.search);
        const sources = queryParams.get("sources")
        const settings = queryParams.get("settings");
      
        let obj = {
            sources: [],
            settings: []
        }

        if(sources) {
            try {
                obj.sources = JSON.parse(decodeURIComponent(sources))
            } catch (error) {
                console.error("Couldn't decode sources", error)
            }
        }
        if(settings) {
            try {
                obj.settings = JSON.parse(decodeURIComponent(settings))
            } catch (error) {
                console.error("Couldn't decode settings", error)
            }
        }

        return obj
    };

    useEffect(() => {
        const url = parseURL();
        
        const yurr = async() => {
            const newPlayers = await url.sources.map( (source, index) => {
                return createPlayer(source, url.settings[index]);
            })
    
            setPlayers(newPlayers)
        }

        yurr()
        
        setSources(url.sources)
        setSettings(url.settings);


        url.sources.forEach((element, index) => {
            checkBlobUrl(element.path).then((res) => {
                if(!res)
                getReplacement(element, index)
            })
        });
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const updateURL = (sources, settings) => {
        console.log("update", sources, settings)
        if(sources.length !== settings.length) return;
        const queryParams = new URLSearchParams();
        queryParams.set("sources", encodeURIComponent(JSON.stringify(sources)));
        queryParams.set("settings", encodeURIComponent(JSON.stringify(settings)))
        window.history.pushState(null, null, "?" + queryParams.toString());
      };
    useEffect(() => updateURL(sources, settings), [sources, settings])

    function addSourceOption(newSource, playerIndex) {
        let newSourceOptions = [...sourceOptions, newSource]
        setSourceOptions(newSourceOptions)

        if(playerIndex !== undefined) {
            changePlayer(playerIndex, newSource)
        }
    }

    function changePlayer(index, source) {
        players[index].audioElement.src = source.path
        players[index].audioElement.load()

        let newSources = sources.map((item, i) => {
            if(i === index) return source
            else return item
        })
        setSources(newSources)

        let newSettings = settings.map((item, i) => {
            if(i === index) return {...item, paused: true}
            else return item
        })
        setSettings(newSettings)
    }

    function removeSource(index) {
        setSources([...sources.slice(0, index), ...sources.slice(index + 1)])
        setPlayers([...players.slice(0, index), ...players.slice(index + 1)])
        setSettings([...settings.slice(0, index), ...settings.slice(index + 1)])
    }

    async function playAll() {
        if(audioContext.state !== "runing") {
            audioContext.resume()
        }
        players.forEach(player => {
            player.audioElement.play()
        });
        let newSettings = settings.map(item => {return {...item, paused: false}})
        setSettings(newSettings)
    }

    function pauseAll() {
        players.forEach(player => {
            player.audioElement.pause()
        });
        let newSettings = settings.map(item => {return {...item, paused: true}})
        setSettings(newSettings)
    }    


    function changeSpeed(index, speed) {
        players[index].audioElement.playbackRate = speed
        let newSettings = settings.map((item, i) => {
            if(i === index) return {...item, speed: speed}
            else return item
        })
        setSettings(newSettings)
    }

    function changeVolume(index, volume) {
        players[index].gainNode.gain.value = volume

        let newSettings = settings.map((item, i) => {
            if(i === index) return {...item, volume: volume}
            else return item
        })
        setSettings(newSettings)
    }

    function changeStereo(index, stereo) {
        players[index].pannerNode.pan.value = stereo

        let newSettings = settings.map((item, i) => {
            if(i === index) return {...item, stereo: stereo}
            else return item
        })
        setSettings(newSettings)
    }

    function toggle(index) {
        if(audioContext.state !== "runing") {
            audioContext.resume()
        }

        let player = players[index].audioElement
        if(player.paused) player.play()
        else player.pause()

        let newSettings = settings.map((item, i) => {
            if(i === index) return {...item, paused: player.paused}
            else return item
        })
        setSettings(newSettings)

        
    }

    return <>
    <MissingFileModal 
        isOpen={toReplace.length > 0} onClose={() => {modal.onClose()}} 
        toReplace={toReplace} addSourceOption={(source, index) => {addSourceOption(source, index)}} 
        removeSource={removeSource} onSubmit={() => {setToReplace([]); updateURL(sources, settings)}}
    />
    <Flex p="16px" flexDir="column" gap="16px">
        <Flex justify="center" gap="16px" ml="16px">
            <Button onClick={playAll}>Play all</Button>
            <Button onClick={pauseAll}>Pause all</Button>
        </Flex>
        <SimpleGrid minChildWidth="200px" gap="16px">
            {sources.map((item, index) => <Card key={index} p="16px" gap="8px" position="relative">
                <Icon viewBox="0 0 24 30" w="40px" h="40px" position="absolute" top="0" right="0" _hover={{bg: "red", fill: "white"}} borderRadius="8px" p="8px" transition="0.2s ease-in"
                    onClick={() => removeSource(index)}
                > 
                    <path d="M11.8489 22.6922C11.5862 22.7201 11.3509 22.5283 11.3232 22.2638L10.4668 14.0733C10.4392 13.8089 10.6297 13.5719 10.8924 13.5441L11.368 13.4937C11.6307 13.4659 11.8661 13.6577 11.8937 13.9221L12.7501 22.1126C12.7778 22.3771 12.5873 22.614 12.3246 22.6418L11.8489 22.6922Z"/><path d="M16.1533 22.6418C15.8906 22.614 15.7001 22.3771 15.7277 22.1126L16.5841 13.9221C16.6118 13.6577 16.8471 13.4659 17.1098 13.4937L17.5854 13.5441C17.8481 13.5719 18.0387 13.8089 18.011 14.0733L17.1546 22.2638C17.127 22.5283 16.8916 22.7201 16.6289 22.6922L16.1533 22.6418Z"/><path clipRule="evenodd" d="M11.9233 1C11.3494 1 10.8306 1.34435 10.6045 1.87545L9.54244 4.37037H4.91304C3.8565 4.37037 3 5.23264 3 6.2963V8.7037C3 9.68523 3.72934 10.4953 4.67218 10.6145L7.62934 26.2259C7.71876 26.676 8.11133 27 8.56729 27H20.3507C20.8242 27 21.2264 26.6513 21.2966 26.1799L23.4467 10.5956C24.3313 10.4262 25 9.64356 25 8.7037V6.2963C25 5.23264 24.1435 4.37037 23.087 4.37037H18.4561L17.394 1.87545C17.1679 1.34435 16.6492 1 16.0752 1H11.9233ZM16.3747 4.37037L16.0083 3.50956C15.8576 3.15549 15.5117 2.92593 15.1291 2.92593H12.8694C12.4868 2.92593 12.141 3.15549 11.9902 3.50956L11.6238 4.37037H16.3747ZM21.4694 11.0516C21.5028 10.8108 21.3154 10.5961 21.0723 10.5967L7.1143 10.6285C6.86411 10.6291 6.67585 10.8566 6.72212 11.1025L9.19806 24.259C9.28701 24.7317 9.69985 25.0741 10.1808 25.0741H18.6559C19.1552 25.0741 19.578 24.7058 19.6465 24.2113L21.4694 11.0516ZM22.1304 8.7037C22.6587 8.7037 23.087 8.27257 23.087 7.74074V7.25926C23.087 6.72743 22.6587 6.2963 22.1304 6.2963H5.86957C5.34129 6.2963 4.91304 6.72743 4.91304 7.25926V7.74074C4.91304 8.27257 5.34129 8.7037 5.86956 8.7037H22.1304Z" fillRule="evenodd"/>
                </Icon>
                <Text>Source</Text>
                <Select value={sources[index].path} onChange={(e) => changePlayer(index, sourceOptions[e.target.selectedIndex])}>
                    {sourceOptions.map((item,index) => {
                    return <option value={item.path} key={index}>{item.name}</option>
                    })}
                </Select>
                <Text>Speed</Text>
                <Input type="number" value={settings[index]?.speed ?? 1} min={0.5} max={16} onChange={(e) => {
                    let val = parseFloat(e.target.value)
                    if (val >= 0.0625 && val <= 16) {
                        changeSpeed(index, val)
                    }
                }}/>
                <Slider aria-label='slider-ex-1' value={settings[index]?.speed ?? 1} min={0.0625} max={16} step={0.1} onChange={(val) => {changeSpeed(index, val)}}>
                    <SliderTrack>
                    <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                </Slider>
                <Text>Stereo</Text>
                <Slider aria-label='slider-ex-1' defaultValue={0} min={-1} max={1} step={0.01} onChange={(val) => {changeStereo(index, val)}}>
                    <SliderTrack>
                    <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                </Slider>
                <Text>Volume</Text>
                <Input type="number" value={settings[index]?.volume ?? 1} min={0.5} max={16} onChange={(e) => {
                    let val = parseFloat(e.target.value)
                    if (val >= 0) {
                        changeVolume(index, val)
                    }
                }}/>
                <Slider aria-label='slider-ex-1' value={settings[index]?.volume ?? 1} min={0} max={1} step={0.01} onChange={(val) => {changeVolume(index, val)}}>
                    <SliderTrack>
                    <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                </Slider>
                <Flex justify="center">
                    <Button onClick={() => toggle(index)}>{settings[index].paused ? "play" : "pause"}</Button>
                </Flex>
            </Card>)}
        </SimpleGrid>
        <Button onClick={() => addSource()}>Add source</Button>
        <Button as="label" htmlFor="upload">Upload file</Button>
        <input id="upload" type="file" accept="audio/*" hidden onChange={(e) => {
            let file = e.target.files[0]
            let url = URL.createObjectURL(file)
            setSourceOptions([...sourceOptions, {
                name: file.name,
                path: url
            }])
        }}/>
    </Flex></>
}