import React, { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import client, { urlFor } from "../sanityClient";

// Speeds are in pixels per second; positive moves the logos to the left
const BASE_SPEED = 45;
const MAX_SPEED = 420;
// Middle part of the strip where the mouse holds the logos still so a card can be read
const DEAD_ZONE = 0.18;
// How quickly the speed eases toward its target (higher = snappier)
const EASING = 3;
const TAP_DISTANCE = 6;

const isSafeHref = (href) => /^https?:/i.test(href || "");

const baseSpeed = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : BASE_SPEED;

const LogoCarousel = () => {
  const [logos, setLogos] = useState([]);
  const [copies, setCopies] = useState(2);
  // Card opened by a tap on touch screens (hover handles it with a mouse)
  const [activeId, setActiveId] = useState(null);

  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const groupRef = useRef(null);
  const motion = useRef({
    offset: 0,
    velocity: BASE_SPEED,
    target: BASE_SPEED,
    groupWidth: 0,
    visible: true,
    hovering: false,
    drag: null,
    suppressClick: false,
  });

  useEffect(() => {
    client
      .fetch(
        `*[_type == "businessLogo" && defined(logo.asset)] | order(coalesce(order, 9999) asc, name asc) {
          _id, name, logo, description, website
        }`
      )
      .then((data) => setLogos(data || []))
      .catch((error) => console.error("Error fetching business logos:", error));
  }, []);

  // Repeat the logos enough times to always fill the screen, and remember one set's width for looping
  useEffect(() => {
    if (!logos.length || !groupRef.current || !viewportRef.current) return undefined;
    const measure = () => {
      const groupWidth = groupRef.current.offsetWidth;
      const viewportWidth = viewportRef.current.offsetWidth;
      motion.current.groupWidth = groupWidth;
      if (groupWidth > 0) setCopies(Math.max(2, Math.ceil(viewportWidth / groupWidth) + 1));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(groupRef.current);
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [logos]);

  // Only animate while the strip is on screen
  useEffect(() => {
    if (!logos.length || !viewportRef.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      motion.current.visible = entry.isIntersecting;
    });
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [logos]);

  useEffect(() => {
    if (!logos.length) return undefined;
    const state = motion.current;
    state.target = baseSpeed();
    state.velocity = state.target;
    let frame;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (state.visible && !state.drag && state.groupWidth > 0) {
        state.velocity += (state.target - state.velocity) * Math.min(1, dt * EASING);
        state.offset += state.velocity * dt;
      }
      if (state.groupWidth > 0 && trackRef.current) {
        const x = ((state.offset % state.groupWidth) + state.groupWidth) % state.groupWidth;
        trackRef.current.style.transform = `translate3d(${-x}px, 0, 0)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [logos]);

  // A tapped-open card holds the strip still so it doesn't slide away
  useEffect(() => {
    if (!motion.current.hovering) {
      motion.current.target = activeId ? 0 : baseSpeed();
    }
  }, [activeId]);

  // Mouse: the further from the middle, the faster the logos travel that way
  const handlePointerMove = (event) => {
    const state = motion.current;
    if (event.pointerType === "mouse") {
      const rect = viewportRef.current.getBoundingClientRect();
      const rel = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const strength = Math.max(0, (Math.abs(rel) - DEAD_ZONE) / (1 - DEAD_ZONE));
      state.hovering = true;
      state.target = Math.sign(rel) * strength * strength * MAX_SPEED;
      return;
    }

    // Touch and pen: drag the strip with a finger
    const drag = state.drag;
    if (!drag) return;
    const dx = event.clientX - drag.lastX;
    const dt = Math.max((event.timeStamp - drag.lastTime) / 1000, 0.001);
    if (!drag.moved && Math.abs(event.clientX - drag.startX) > TAP_DISTANCE) {
      drag.moved = true;
      viewportRef.current.setPointerCapture?.(event.pointerId);
    }
    if (drag.moved) {
      state.offset -= dx;
      drag.velocity = -dx / dt;
    }
    drag.lastX = event.clientX;
    drag.lastTime = event.timeStamp;
  };

  const handlePointerLeave = (event) => {
    if (event.pointerType !== "mouse") return;
    motion.current.hovering = false;
    motion.current.target = activeId ? 0 : baseSpeed();
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse") return;
    motion.current.drag = {
      startX: event.clientX,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
      moved: false,
    };
  };

  const handlePointerUp = () => {
    const state = motion.current;
    const drag = state.drag;
    if (!drag) return;
    state.drag = null;
    if (drag.moved) {
      // Let the strip coast after a swipe, then ease back to its normal pace
      state.velocity = Math.max(-MAX_SPEED * 3, Math.min(MAX_SPEED * 3, drag.velocity));
      state.target = baseSpeed();
      state.suppressClick = true;
      setActiveId(null);
    }
  };

  const handleCardClick = (event, id) => {
    if (motion.current.suppressClick) {
      motion.current.suppressClick = false;
      event.preventDefault();
      return;
    }
    // Taps open a card; with a mouse, hovering already does that
    if (window.matchMedia("(hover: none)").matches && !event.target.closest("a")) {
      setActiveId((current) => (current === id ? null : id));
    }
  };

  if (!logos.length) return null;

  return (
    <Section>
      <Heading>Businesses That Give Back</Heading>
      <Viewport
        ref={viewportRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <Track ref={trackRef}>
          {Array.from({ length: copies }, (_, copy) => (
            <Group key={copy} ref={copy === 0 ? groupRef : undefined} aria-hidden={copy > 0 || undefined}>
              {logos.map((logo) => (
                <Card
                  key={logo._id}
                  $active={activeId === logo._id}
                  tabIndex={copy === 0 ? 0 : -1}
                  onClick={(event) => handleCardClick(event, logo._id)}
                  onFocus={() => { motion.current.target = 0; }}
                  onBlur={() => { motion.current.target = activeId ? 0 : baseSpeed(); }}
                >
                  <LogoBox>
                    <LogoImage
                      src={urlFor(logo.logo).height(160).url()}
                      alt={copy === 0 ? `${logo.name} logo` : ""}
                      loading="lazy"
                      draggable={false}
                    />
                  </LogoBox>
                  <Details>
                    <Name>{logo.name}</Name>
                    {logo.description && <Blurb>{logo.description}</Blurb>}
                    {isSafeHref(logo.website) && (
                      <VisitLink
                        href={logo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={copy === 0 ? 0 : -1}
                      >
                        Visit website
                      </VisitLink>
                    )}
                  </Details>
                </Card>
              ))}
            </Group>
          ))}
        </Track>
      </Viewport>
    </Section>
  );
};

const Section = styled.section`
  width: 100%;
  background-color: #fce4ec;
  padding: 1rem 0 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Heading = styled.h2`
  font-size: 3rem;
  font-weight: bold;
  color: var(--text-color);
  margin: 2rem 1rem 0.5rem;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Viewport = styled.div`
  width: 100%;
  overflow: hidden;
  /* Fixed height leaves room for an expanded card without pushing the footer around */
  height: 22rem;
  display: flex;
  align-items: center;
  touch-action: pan-y;
  user-select: none;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
  mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);

  @media (max-width: 768px) {
    height: 19rem;
  }
`;

const Track = styled.div`
  display: flex;
  align-items: center;
  will-change: transform;
`;

const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-right: 1.5rem;

  @media (max-width: 768px) {
    gap: 1rem;
    padding-right: 1rem;
  }
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.35s ease, opacity 0.25s ease, padding 0.35s ease;
  padding: 0 0.9rem;
  text-align: center;
`;

const expanded = `
  z-index: 2;
  border-color: #f48fb1;
  box-shadow: 0 12px 30px rgba(233, 30, 140, 0.3);
`;

const Card = styled.div`
  flex: 0 0 auto;
  width: 200px;
  background: #fff;
  border: 4px solid #f8bbd0;
  border-radius: 1rem;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.12);
  cursor: pointer;
  position: relative;
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
  outline: none;

  @media (max-width: 768px) {
    width: 160px;
  }

  @media (hover: hover) {
    &:hover {
      ${expanded}
      transform: scale(1.12);
    }
    &:hover ${Details} {
      max-height: 10rem;
      opacity: 1;
      padding: 0 0.9rem 0.9rem;
    }
  }

  &:focus-visible {
    ${expanded}
    transform: scale(1.12);
    border-color: #e91e8c;
  }

  &:focus-within ${Details} {
    max-height: 10rem;
    opacity: 1;
    padding: 0 0.9rem 0.9rem;
  }

  ${({ $active }) =>
    $active &&
    css`
      ${expanded}
      transform: scale(1.08);

      ${Details} {
        max-height: 10rem;
        opacity: 1;
        padding: 0 0.9rem 0.9rem;
      }
    `}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const LogoBox = styled.div`
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;

  @media (max-width: 768px) {
    height: 100px;
  }
`;

const LogoImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  pointer-events: none;
`;

const Name = styled.h3`
  font-size: 1rem;
  font-weight: bold;
  color: #880e4f;
  margin: 0;
`;

const Blurb = styled.p`
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--text-color);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const VisitLink = styled.a`
  font-size: 0.85rem;
  font-weight: 600;
  color: #e91e8c;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

export default LogoCarousel;
