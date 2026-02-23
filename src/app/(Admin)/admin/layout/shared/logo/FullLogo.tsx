"use client";

import Image from "next/image";
import Link from "next/link";

const FullLogo = () => {
  return (
    // <Link href={"/"}>
    <>
      {/* Dark Logo */}
      <Image
        src="/images/logos/light_logo.png"
        alt="logo"
        width={135}
        height={40}
        className="block dark:hidden rtl:scale-x-[-1] w-[110px] sm:w-[135px] h-auto"
      />
      {/* Light Logo */}
      <Image
        src="/images/logos/dark_logo.png"
        alt="logo"
        width={135}
        height={40}
        className="hidden dark:block rtl:scale-x-[-1] w-[110px] sm:w-[135px] h-auto"
      />
    </>

    // </Link>
  );
};

export default FullLogo;
