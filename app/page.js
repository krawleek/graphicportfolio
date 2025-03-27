"use client";

import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { RichText, combineCollections } from 'readcv';
import '@fontsource-variable/inter';
import {proxy, useSnapshot} from 'valtio';
import {
  useWindowWidth,
} from '@react-hook/window-size'

const state = proxy({
  selectedItem: null,
  scrollTo: undefined, // function to scrollTo(x, y) in canvas, assigned in Canvas
  showLayers: false, // for mobile only
  showInspector: false, // for mobile only
  hideLayers: false, // for desktop only
  hideInspector: false, // for desktop only
  hideHeader: false, // for desktop only
});

import cv from './cv';

function App() {
  const { hideLayers, hideInspector, hideHeader } = useSnapshot(state);
  React.useEffect(() => {
    function onKeyDown(e) {
      switch (e.key) {
        case ".":
          if (e.metaKey) {
            state.hideLayers = !state.hideLayers;
            state.hideInspector = !state.hideInspector;
            state.hideHeader = !state.hideHeader;
          }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    }
  }, []);
    const layoutRef = React.useRef(null);

  return (
    <div
      ref={layoutRef}
      className={layout
    ${hideHeader ? "" : "with-header"}
    ${hideLayers ? "" : "with-layers"}
    ${hideInspector ? "" : "with-inspector"}
    }>
      {hideHeader ? null : <Header />}
      {hideLayers ? null : <Layers />}
      <Canvas />
      {hideInspector ? null : <Inspector />}
    </div>
  );
}

const LOCAL_STORAGE_ADJUSTABLE_SIDEBAR_KEY = "adjustable-sidebar-width";
const MAX_WIDTH = 400;
const MIN_WIDTH = 100;

/**
 * @prop className
 * @prop side: "left" | "right"
 */
function AdjustableSidebar(props) {
  const storageKey = LOCAL_STORAGE_ADJUSTABLE_SIDEBAR_KEY + props.side;
  const [width, setWidth] = React.useState(
    window.localStorage.getItem(
      storageKey
    ) ?? "280px"
  );
  const startX = React.useRef(undefined);
  const startWidth = React.useRef(undefined);
  function onPointerDown(e) {
    startX.current = e.clientX;
    startWidth.current = parseInt(width);
  }
  React.useEffect(() => {
    function onPointerMove(e) {
      if (startX.current === undefined) {
        return;
      }
      const diff = e.clientX - startX.current;
      const newWidth = Math.max(Math.min(
        startWidth.current + (diff * (props.side === "right" ? -1 : 1)),
        MAX_WIDTH
      ), MIN_WIDTH);
      const newWidthStr = newWidth + "px";
      setWidth(newWidthStr);
      window.localStorage.setItem(
        storageKey,
        newWidthStr
      );
    }
    function onPointerUp(e) {
      startX.current = undefined;
      startWidth.current = undefined;
    }
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
    }
  }, []);

  const windowWidth = useWindowWidth();

  if (windowWidth < 640) {
    return <>
      <div className={`sidebar-backdrop ${props.shown ? "active" : ""}`}
        onPointerDown={props.onClickBackdrop}
        />
      <div className={props.className}>
        {props.children}
      </div>
    </>;
  }
  
  return (
    <div style={{position: "relative"}}>
    <div 
      style={{
        width
      }}
      className={props.className}
      >
      {props.children}
    </div>
      <div 
        className="adjustable-sidebar-grabber"
        style={{
          left: props.side === "right" ? 0 : "auto",
          right: props.side === "left" ? 0 : "auto",
        }}
        onPointerDown={onPointerDown}
        />
    </div>
  );
}


<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <script src="http://d3lp1msu2r81bx.cloudfront.net/kjs/js/lib/kinetic-v4.7.4.min.js"></script>
  <script src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
  <script src="https://rawgithub.com/brandonaaron/jquery-mousewheel/master/jquery.mousewheel.js"></script>
</head>
<body>
  <div id="container"></div>

<script type='text/javascript'>
function makePos(x, y) {
    return {
        'x': x,
        'y': y
    };
}


function View() {
    this.init = init;

    var self = this;

    var kineticStage,
        kineticLayer,
        kineticTextLayer,

        zoomOrigin = makePos(0, 0),
        zoomFactor = 1.1,
        pinchLastDist, pinchStartCenter;

    init();

    function init() {

        // disable ipad zoom to prevent safari from zooming on orientation change
        $('head meta[name=viewport]').remove();
        $('head').prepend('<meta name="viewport" content="user-scalable=no, width=device-width, minimum-scale=1.0 , initial-scale=1.0, maximum-scale=1.0" />');

        // create stage layer and circle
        kineticStage = new Kinetic.Stage({
            container: 'container',
            width: $(document).width() - 10,
            height: $(document).height() - 10,
        });

        kineticLayer = new Kinetic.Layer({
            draggable: true
        });
        var circle = new Kinetic.Circle({
            x: 200,
            y: 200,
            radius: 50,
            fill: '#00D200',
            stroke: 'black',
            strokeWidth: 2,
        });
        kineticLayer.add(circle);
        kineticStage.add(kineticLayer);

        kineticTextLayer = new Kinetic.Layer({});
        kineticStage.add(kineticTextLayer);

        // register events and proxy to methods
        $(kineticStage.content).on('mousewheel', function(e) {
            e.preventDefault();
            var evt = e.originalEvent;
            stageMouseWheel.call(self, evt.deltaY, makePos(evt.clientX, evt.clientY));
        });
        kineticStage.getContent().addEventListener('touchmove', function(e) {
            e.preventDefault(); // prevent iPAD panning
            var touch1 = e.touches[0];
            var touch2 = e.touches[1];
            if (touch1 && touch2) {
            touch1.offsetX = touch1.pageX - $(touch1.target).offset().left;
            touch1.offsetY = touch1.pageY - $(touch1.target).offset().top;
            touch2.offsetX = touch2.pageX - $(touch2.target).offset().left;
            touch2.offsetY = touch2.pageY - $(touch2.target).offset().top;
            stagePinch.call(self, makePos(touch1.offsetX, touch1.offsetY), makePos(touch2.offsetX, touch2.offsetY));
            }
        }, false);
        kineticStage.getContent().addEventListener('touchend', function(e) {
            stageTouchEnd.call(self);
        }, false);

        $(window).on("orientationchange", function(event) {
            window.scrollTo(0, 0); // scroll to top left on orientation change
        });

        editTextLayer('scrollwheel/pinch to zoom');
        window.scrollTo(0, 0);
    }

    function zoom(newscale, center) { // zoom around center
        var mx = center.x - kineticLayer.getX(),
            my = center.y - kineticLayer.getY(),
            oldscale = kineticLayer.getScaleX();
        editTextLayer('zoom ' + newscale.toFixed(2) + ' around ' + mx.toFixed(2) + ',' + my.toFixed(2));

        zoomOrigin = makePos(mx / oldscale + zoomOrigin.x - mx / newscale, my / oldscale + zoomOrigin.y - my / newscale);

        kineticLayer.setOffset(zoomOrigin.x, zoomOrigin.y);
        kineticLayer.setScale(newscale);
        kineticLayer.draw();
    }

    function stageMouseWheel(factor, p) {
        var oldscale = kineticLayer.getScaleX(),
            newscale = oldscale * (zoomFactor - (factor < 0 ? 0.2 : 0));
        zoom(newscale, p);
    }

    function stagePinch(p1, p2) {
        var dist = Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2));
        if (!pinchLastDist) pinchLastDist = dist;
        var newscale = kineticLayer.getScale().x * dist / pinchLastDist;

        var center = makePos(Math.abs((p1.x + p2.x) / 2), Math.abs((p1.y + p2.y) / 2));
        if (!pinchStartCenter) pinchStartCenter = center;

        zoom(newscale, pinchStartCenter);
        pinchLastDist = dist;
    }

    function stageTouchEnd() {
        pinchLastDist = pinchStartCenter = 0;
    }

    function editTextLayer(text) {
        var label = new Kinetic.Text({
            x: 0,
            y: 0,
            text: text,
            fontSize: 12,
            fontFamily: 'Calibri',
            fill: 'black'
        });

        kineticTextLayer.destroyChildren();
        kineticTextLayer.add(label);
        kineticTextLayer.drawScene();
    }
}


$(window).load(function() {
    var view = new View();
}); 
</script>

</body>
</html>

function Header(props) {
  return (
    <nav className="header">
      <div className="header-items">
        <a className="header-item" aria-label="View CV" href={`https://read.cv/${cv.general.username}`} target="_blank">
          <IconReadCV />
        </a>
        <LayersToggle />
      </div>
      <h1>{cv.general.displayName}</h1>
      <div className="header-items">
        <InspectorToggle />
        <div className="header-item" onClick={() => {
          state.showInspector = true;
        }}>
          <img src={cv.general.profilePhoto} height="24px" width="24px"  />
        </div>
      </div>
    </nav>
  );
}


function createMatcher(prefix, suffix) {
  const pattern = new RegExp(`${prefix}\/([a-zA-Z0-9-]+)${suffix}`);
  return (input) => {
    const match = input.match(pattern);
    return match ? match[1] : null;
  };
}

function getProjectIdFromAttachmentUrl(url) { return createMatcher('profileItems', '\/')(url) }
function getAttachmentIdFromAttachmentUrl(url) { return createMatcher('newProfileItem', '\.')(url) }

function getPathForAttachment(attachment) {
  return getProjectIdFromAttachmentUrl(attachment.url) + "/" + getAttachmentIdFromAttachmentUrl(attachment.url);
  
}

function isMobile() {
  return window.innerWidth < 640;
}
function preventDefault(e) {
  e.preventDefault();
}

function getOffsetInCanvas(el, centerX) {
  const canvas = document.getElementById("canvas");
  const canvasContent = document.getElementById("canvas-content");
  if (!canvas) {
    return;
  }
  const rect = el.getBoundingClientRect();
  const canvasContentRect = canvasContent.getBoundingClientRect();
  let offsetX = rect.x - canvasContentRect.x;
  let offsetY = rect.y - canvasContentRect.y;
  // Center it based on canvas
  const canvasRect = canvas.getBoundingClientRect();
  offsetY -= (canvasRect.height - rect.height) / 2;
  if (centerX) {
    offsetX -= (canvasRect.width - rect.width) / 2;
  }
  return {x: offsetX, y: offsetY }
  
}

function IconReadCV() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.737 7.958a.75.75 0 10-.389 1.45l7.245 1.94A.75.75 0 1018.98 9.9l-7.244-1.94zM10.896 11.098a.75.75 0 00-.389 1.448l7.245 1.942a.75.75 0 00.388-1.45l-7.245-1.94zM9.136 14.767a.75.75 0 01.918-.53l4.83 1.294a.75.75 0 01-.388 1.449l-4.83-1.294a.75.75 0 01-.53-.919z" fill="currentcolor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M16.5 23.987L6.841 21.4a2.75 2.75 0 01-1.944-3.368L8.132 5.957A2.75 2.75 0 0111.5 4.013L21.16 6.6a2.75 2.75 0 011.944 3.368l-3.236 12.074a2.75 2.75 0 01-3.368 1.944zM6.345 18.42a1.25 1.25 0 00.884 1.531l9.66 2.588a1.25 1.25 0 001.53-.883L21.655 9.58a1.25 1.25 0 00-.884-1.531L11.11 5.46a1.25 1.25 0 00-1.53.884L6.345 18.42z" fill="currentcolor"></path></svg>
}

function IconList() {
  return <svg class="svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path fill="currentcolor" fill-opacity="1" fill-rule="nonzero" stroke="none" d="M16 13H2v1h14v-1zm0-5H2v1h14V8zm0-5H2v1h14V3z"></path></svg>
}

function IconBook() {
  return <svg class="svg" xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14"><path fill="currentcolor" fill-opacity="1" fill-rule="evenodd" stroke="none" d="M8.373 13h1.258c.28-.32.616-.597.995-.819 1.479-.862 4.005-.909 5.386.109H17.5v-9.2c0 0-.797-2.25-4.42-2.25-1.875 0-2.902.602-3.456 1.184-.389.407-.545.803-.6.976h-.049c-.054-.173-.21-.57-.599-.976C7.822 1.442 6.795.84 4.92.84 1.297.84.5 3.09.5 3.09v9.19h1.488c1.382-1.019 3.91-.97 5.388-.105.38.223.717.502.997.825zM9.5 3.289v8.457c.195-.158.403-.3.622-.428.927-.541 2.115-.796 3.241-.787 1.006.008 2.081.227 2.952.759h.185V3.317l-.03-.05c-.086-.138-.236-.339-.474-.545-.461-.397-1.33-.882-2.916-.882-1.586 0-2.34.484-2.694.835-.189.186-.296.367-.353.49-.03.061-.046.107-.053.131l-.005.017.001-.006.002-.008v-.005l.001-.002V3.29l-.005-.001H9.5zm-1 0h-.474l-.006.001v.002l.001.002.001.005.002.008.001.006c0 .001 0-.005-.005-.017-.007-.024-.024-.07-.053-.131-.057-.123-.164-.304-.353-.49-.354-.351-1.108-.835-2.694-.835-1.585 0-2.455.485-2.916.882-.238.206-.388.407-.474.545l-.03.05v7.963h.185c.872-.532 1.948-.752 2.954-.759 1.128-.008 2.316.249 3.243.792.217.127.424.27.618.426V3.29z"></path></svg>
}

function IconArtboard(props) {
  return (
    <svg className="sidebar-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="currentcolor" fillOpacity="1" fillRule="evenodd" stroke="none" d="M4 .5V3h4V.5h1V3h2.5v1H9v4h2.5v1H9v2.5H8V9H4v2.5H3V9H.5V8H3V4H.5V3H3V.5h1zM8 8V4H4v4h4z"></path></svg>
  );
}

function IconSection() {
  return <svg className="sidebar-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="currentcolor" fillOpacity=".9" fillRule="evenodd" stroke="none" d="M.5 0C.224 0 0 .224 0 .5v11c0 .276.224.5.5.5h11c.276 0 .5-.224.5-.5V.5c0-.276-.224-.5-.5-.5H.5zM6 1H1v3h5V1zM1 5h5.5c.276 0 .5-.224.5-.5V1h4v10H1V5z"></path></svg>
}

function IconImage() {
  return <svg className="sidebar-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentcolor" fillOpacity="1" fillRule="evenodd" stroke="none" d="M12 6c0 1.105-.895 2-2 2-1.105 0-2-.895-2-2 0-1.105.895-2 2-2 1.105 0 2 .895 2 2zm-1 0c0 .552-.448 1-1 1-.552 0-1-.448-1-1 0-.552.448-1 1-1 .552 0 1 .448 1 1zM3 2c-.552 0-1 .448-1 1v10c0 .552.448 1 1 1h10c.552 0 1-.448 1-1V3c0-.552-.448-1-1-1H3zm10 1H3v6.293l2.5-2.5L11.707 13H13V3zM3 13v-2.293l2.5-2.5L10.293 13H3z"></path></svg>
}

function IconCaret() {
  return <svg className="sidebar-icon details-rotate-open" xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6"><path fill="currentcolor" fillOpacity="1" fillRule="nonzero" stroke="none" d="m3 5 3-4H0l3 4z"></path></svg>
}

function InspectorToggle() {
  return <button
           aria-label="Info"
           className="header-item"
           onClick={() => {
             if (isMobile()) {
               state.showInspector = !state.showInspector
             } else {
               state.hideInspector = !state.hideInspector
             }
           }}
           >
    <IconBook />
  </button>
}


function Inspector(props) {
  const {selectedItem, showInspector} = useSnapshot(state);
  return (
    <AdjustableSidebar
      className={`sidebar inspector ${showInspector ? "shown" : ""}`}
      shown={showInspector}
      onClickBackdrop={() => state.showInspector = false}
      side="right">
       <SidebarSection>
        <SidebarTitle>Inspector</SidebarTitle>
      </SidebarSection>
      <SidebarDivider />
      <SelectedItemSwitch item={selectedItem} />
    </AdjustableSidebar>
  );
}

function SelectedItemSwitch(props) {
  const {item} = props;
  switch(item?.type ?? "") {
    case "project":
    case "sideProject":
      return <ProjectInfo item={item} />;
    case "image":
    case "video":
      const project = [...cv.projects, ...cv.sideProjects].find(project => 
        project.attachments.find(attachment =>
          attachment.url === item.url
        ) !== undefined
      )
      if (project) {
        return <ProjectInfo item={project} />
      }
    default:
      return <Profile />;
  }
}

function Profile(props) {
  const item = cv.general;
  return <>
    <SidebarSection large>
      <SidebarTitle>
        {item.displayName}
      </SidebarTitle>
      <RichText text={item.about} />
    </SidebarSection>
     <SidebarDivider />
    <SidebarSection>
      <SidebarFields>
      {item.profession && <SidebarField>
        <SidebarKey>Profession</SidebarKey>
        <SidebarValue>{item.profession}</SidebarValue>
      </SidebarField>}
      {item.status?.text && <SidebarField>
        <SidebarKey>Status</SidebarKey>
        <SidebarValue>
          {item.status.emoji}
          {item.status.text}
        </SidebarValue>
      </SidebarField>}
      {item.website && <SidebarField>
        <SidebarKey>Website</SidebarKey>
        <SidebarValueLink href={item.websiteUrl}>{item.website}</SidebarValueLink>
      </SidebarField>}
      {item.location && <SidebarField>
        <SidebarKey>Location</SidebarKey>
        <SidebarValue>{item.location}</SidebarValue>
      </SidebarField>}
        </SidebarFields>
    </SidebarSection>
  </> 
}

function ProjectInfo({item}) {
  return <>
    <SidebarSection large>
      <SidebarTitle>
        {item.title}
      </SidebarTitle>
      {item.description && <RichText text={item.description} />}
    </SidebarSection>
    <SidebarDivider />
    <SidebarSection>
      <SidebarFields>
      {item.year && <SidebarField>
        <SidebarKey>Year</SidebarKey>
        <SidebarValue>{item.year}</SidebarValue>
      </SidebarField>}
      {item.company && <SidebarField>
        <SidebarKey>Company</SidebarKey>
        <SidebarValue>{item.company}</SidebarValue>
      </SidebarField>}
      {item.url && <SidebarField>
        <SidebarKey>URL</SidebarKey>
        <SidebarValueLink href={item.url}>{item.url}</SidebarValueLink>
      </SidebarField>}
      {item.collaborators?.length > 0 && <SidebarField>
        <SidebarKey>Collaborators</SidebarKey>
        <SidebarValue>{item.collaborators.map(c => c.name).join(",")}</SidebarValue>
      </SidebarField>}
        </SidebarFields>
    </SidebarSection>
  </>
}

function LayersToggle() {
  return <button
           aria-label="Layers"
           className="header-item"
           onClick={() => {
             if (isMobile()) {
               state.showLayers = !state.showLayers
             } else {
               state.hideLayers = !state.hideLayers
             }
           }}
           >
    <IconList />
  </button>
}

function Layers(props) {
  const {showLayers} = useSnapshot(state);
  console.log(cv);
  return (
    <AdjustableSidebar
      className={`sidebar layers ${showLayers ? "shown" : ""}`}
      shown={showLayers}
      onClickBackdrop={() => state.showLayers = false}
      side="left">
      <SidebarSection>
        <SidebarTitle>Layers</SidebarTitle>
      </SidebarSection>
      <SidebarDivider />
      {cv.projects && cv.projects.length > 0 && <Collection
        title="Projects"
        items={cv.projects}
        path="projects"
        Renderer={SectionItem}
        ItemRenderer={ProjectCollection}
      />}
      {cv.sideProjects && cv.sideProjects.length > 0 && <Collection
        title="Side Projects"
        path="sideProjects"
        items={cv.sideProjects}
        Renderer={SectionItem}
        ItemRenderer={ProjectCollection}
      /> }
      {!cv.projects || !cv.sideProjects || (cv.sideProjects.length + cv.projects.length === 0) && <SidebarItem>No projects yet</SidebarItem>}
    </AdjustableSidebar>
  );
}

const LOCAL_STORAGE_COLLECTION_OPEN_KEY = "open-collections"
function Collection(props) {
  const {title, path, items, Renderer, ItemRenderer, onClick, selected } = props;
  function getOpenCollections() {
    return JSON.parse(
      window.localStorage.getItem(
        LOCAL_STORAGE_COLLECTION_OPEN_KEY
      ) ?? "{}"
    )
  }
  const [isOpen, setIsOpen] = React.useState(
    getOpenCollections()[path]
  );
  
  return <>
    <details 
      open={isOpen}
      onToggle={(e) => {
        e.preventDefault();
        const open = e.currentTarget.open;
        setIsOpen(open);
        const nextOpens = getOpenCollections();
        nextOpens[path] = open;
        window.localStorage.setItem(
          LOCAL_STORAGE_COLLECTION_OPEN_KEY,
          JSON.stringify(nextOpens)
        )
      }}
    >
      <summary onClick={onClick}>
        <Renderer className={selected ? "selected" : ""}>
          {props.title}
        </Renderer>
      </summary>
      {items ? <Indent>
        {items.map((item, index) => (
          <ItemRenderer
            key={index}
            item={item}
            index={index}
            path={path} />
        ))}
      </Indent> : null}
    </details>
  </>;
}

function ProjectCollection(props) {
  const {selectedItem} = useSnapshot(state);
  const { item, path, index } = props;
  return <Collection
    title={item.title}
    items={item.attachments}
    path={path + "/" + index}
    Renderer={ArtboardItem}
    ItemRenderer={AttachmentItem}
    selected={JSON.stringify(state.selectedItem) === JSON.stringify(item) ? "selected" : ""}
    onClick={() => {
      state.selectedItem = item;
      const el = document.getElementById(item.title)
      const offset = getOffsetInCanvas(el);
      state.scrollTo(-offset.x, -offset.y);
    }}
  />
}

function AttachmentItem(props) {
  const { item, index, path } = props;
  const attachmentPath = path + getAttachmentIdFromAttachmentUrl(item.url);
  const {selectedItem} = useSnapshot(state);
  
  return <ImageItem
    onClick={() => {
      state.selectedItem = item;
      const el = document.getElementById(item.url)
      const offset = getOffsetInCanvas(el, true);
      state.scrollTo(-offset.x, -offset.y);
    }}
    className={
    selectedItem && selectedItem.url === item.url ? "selected" : ""
    }
  >
    Image {index + 1}
  </ImageItem>
}


function SectionItem(props) {
  return <SidebarItem>
    <IconCaret />
    <IconSection />
    <h3 className="sidebar-title">{props.children}</h3>
  </SidebarItem>
}

function ArtboardItem(props) {
  const {children, ...rest} = props;
  return <SidebarItem {...rest}>
    <IconCaret />
    <IconArtboard />
    {props.children}
  </SidebarItem>
}

function ImageItem(props) {
  const {children, ...rest} = props;
  return <SidebarItem {...rest}>
    <IconImage />
    {children}
  </SidebarItem>
}

function Indent(props) {
  return <div className="sidebar-indent">{props.children}</div>
}

function SidebarSection(props) {
  return (
    <section className={`sidebar-section ${props.large ? "large" : ""}`}>{props.children}</section>
  );
}
function SidebarTitle(props) {
  return (
    <h2 className="sidebar-title">{props.children}</h2>
  );
}

function SidebarDivider(props) {
  return (
    <hr className="sidebar-divider"></hr>
  );
}

function SidebarItem({children, ...rest}) {
  return (
    <li {...rest}
      className={`sidebar-item ${rest.className}`}
      >{children}</li>
    )
}

function SidebarFields(props) {
  return <fieldset className="sidebar-fields">
    {props.children}
  </fieldset>
}

function SidebarField(props) {
  return <label className="sidebar-field">
    {props.children}
  </label>
}

function SidebarKey(props) {
  return <span className="sidebar-key">
    {props.children}
  </span>
}

function SidebarValue(props) {
  return <input className="sidebar-value" defaultValue={props.children} readOnly />
}

function SidebarValueLink(props) {
  return <a target="_blank" className="sidebar-value" {...props}/>
}

export default App;