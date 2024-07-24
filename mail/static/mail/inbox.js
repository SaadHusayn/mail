function func(df) {
  console.log('hello', df);
}

document.addEventListener('DOMContentLoaded', function () {

  document.querySelectorAll('.mail').forEach(mail => {
    console.log('hello');

    mail.onclick = function () {
      func(3);
    };
  })

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // when submit button is pressed on compose mail
  document.querySelector('#compose-form').onsubmit = function () {
    // remove all error messages
    document.querySelectorAll('.text-danger').forEach(e => e.remove());
    const Recipients = document.querySelector('#compose-recipients').value;
    const Subject = document.querySelector('#compose-subject').value;
    const Body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: Recipients,
        subject: Subject,
        body: Body
      })
    })
      .then(response => response.json())
      .then(result => {
        if (result.error !== undefined) {
          let error = document.createElement('span');
          error.classList.add("text-danger");
          error.innerHTML = result.error;
          document.querySelector('#compose-form').append(error);
          console.log(result.error);
        } else {
          load_mailbox('sent');
        }
      });


    return false;
  }
});

function compose_email() {
  // remove all errors
  document.querySelectorAll('.text-danger').forEach(e => e.remove());

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';


}

function load_mailbox(mailbox) {
  // Getting the HTML element from DOM
  var email_view = document.querySelector('#emails-view');


  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  let mailBoxName = mailbox.charAt(0).toUpperCase() + mailbox.slice(1);
  email_view.innerHTML = `<h3>${mailBoxName}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // Print emails on console
      console.log(emails);

      if (emails.length === 0) {
        //mailbox is empty
        let message = document.createElement('h5');
        message.innerHTML = `(${mailBoxName} Mailbox is empty).`;
        email_view.append(message);
      } else {

        // ... modifying DOM ...
        let container = document.createElement('div');
        container.className = "container mails";
        email_view.append(container);
        emails.forEach(mail => {
          let row = document.createElement('div');
          if (mail.read) {
            row.className = "row border p-1 border-black mail bg-secondary";
          } else {
            row.className = "row border p-1 border-black mail bg-light";
          }

          let email = document.createElement('div');
          email.className = "col-2 text-start fw-bold";

          if (mailbox === 'sent') {
            if (mail.recipients.length > 1) {
              email.innerHTML = `${mail.recipients[0]}, ...`;
            } else {
              email.innerHTML = `${mail.recipients[0]}`;
            }
          } else {
            email.innerHTML = `${mail.sender}`;
          }

          row.append(email);

          let subject = document.createElement('div');
          subject.className = "col-7";
          subject.innerHTML = mail.subject;

          row.append(subject);

          let timestamp = document.createElement('div');
          timestamp.className = "col-3 text-end";
          timestamp.innerHTML = mail.timestamp;

          row.append(timestamp);

          container.append(row);

          row.onclick = () => {
            func(33);
          }

        })
      }

    });
}