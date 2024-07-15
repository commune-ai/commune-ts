"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";

import { tutorials } from "../docs/[...slug]/tutorials";

interface DocSidebarProps {
  prefix: string;
  activeTutorial: number;
  activeContent: number;
  params: { slug: string };
}

export function DocSidebar(props: DocSidebarProps): JSX.Element {
  const { params, activeTutorial, activeContent, prefix } = props;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function toggleMobileMenu(): void {
    setMobileMenuOpen(!mobileMenuOpen);
  }

  const commonButtonClass =
    "flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100/10 p-1.5 hover:bg-gray-100/[0.15]";

  return (
    <>
      <div
        aria-hidden="true"
        aria-label="Global"
        className={`animate-menu-fade fixed z-10 h-[calc(100svh-69px)] lg:h-[calc(100svh-123px)] w-full backdrop-blur-sm lg:w-[17rem] lg:backdrop-blur-none ${mobileMenuOpen ? "visible" : "hidden"} lg:block`}
        onClick={toggleMobileMenu}
      >
        <div
          className={`sm:min-w-2/6 relative h-full w-4/6 overflow-y-scroll border-r border-gray-900/[0.06] bg-[url('/bg-pattern.svg')] p-8 sm:w-3/6 md:w-2/6 lg:mx-auto lg:w-full`}
        >
          <button
            className={`${commonButtonClass} absolute right-0 top-0 m-5 h-8 w-8 rounded-xl lg:hidden`}
            onClick={toggleMobileMenu}
            type="button"
          >
            <span className="sr-only">Close menu</span>
            <ChevronLeftIcon
              aria-hidden="true"
              className="h-6 w-6 fill-white"
            />
          </button>
          {tutorials.map((tutorial) => {
            return (
              <div key={tutorial.title}>
                <span className="text-base font-medium text-white">
                  {tutorial.title}
                </span>
                <div className="my-3 ml-1">
                  {tutorial.contents.map((content) => {
                    return (
                      <Link
                        //eslint-disable-next-line
                        className={`relative mt-0 flex items-center border-l border-gray-600/70 p-3 ${params.slug[1] === content.href && params.slug[0] === tutorial.tutorialId ? "text-white" : " text-gray-400 hover:text-gray-200"}`}
                        href={`${prefix}/${tutorial.tutorialId}/${content.href}`}
                        key={content.name}
                      >
                        {params.slug[1] === content.href &&
                          params.slug[0].startsWith(tutorial.tutorialId) && (
                            <div className="absolute -left-1 h-2 w-2 rounded-full bg-white" />
                          )}
                        <span>{content.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <div className="sticky top-0 z-0 flex h-12 w-full items-center border-b border-gray-50/[0.06] bg-transparent pl-6 text-sm text-gray-400 lg:hidden">
          <button
            className={`${commonButtonClass} mr-6 h-8 w-8 rounded-xl`}
            onClick={toggleMobileMenu}
            type="button"
          >
            <Bars3Icon className="fill-white" width={16} />
          </button>
          <span className="mr-2 font-light">
            {tutorials[activeTutorial].title}
          </span>
          <ChevronRightIcon width={16} />
          <span className="ml-2 font-semibold text-white">
            {tutorials[activeTutorial].contents[activeContent].name}
          </span>
        </div>
      </div>
    </>
  );
}
